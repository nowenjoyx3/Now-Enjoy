/* NOW ENJOY - shared Supabase Auth helper
   Loaded on every page AFTER the Supabase library and BEFORE the page script.
   Only the PUBLISHABLE key lives here. Never put a secret / service-role key in this file. */
(() => {
  'use strict';

  const SUPABASE_URL = 'https://jipfmbcrkxsgvifobcpp.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BwnGaqHr14PPORWcKCKGMg_AxKprHpm';

  // Remove data left behind by the OLD browser-only login system
  // (it stored the whole user object, including a password hash, in localStorage).
  try {
    localStorage.removeItem('now_enjoy_session_user');
    localStorage.removeItem('nowEnjoyProfileOverrides');
  } catch (_) {}

  let client = null;
  try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    } else {
      console.error('Supabase library did not load. Check the <script> tag and your internet connection.');
    }
  } catch (err) {
    console.error('Could not create Supabase client:', err);
  }

  async function getSession() {
    if (!client) return null;
    try {
      const { data, error } = await client.auth.getSession();
      if (error) return null;
      return data.session || null;
    } catch (_) {
      return null;
    }
  }

  // If the user logs out in another tab (or the session dies), send this tab to the login page.
  let watching = false;
  function watchSignOut() {
    if (watching || !client) return;
    watching = true;
    client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') location.replace('index.html');
    });
  }

  // Protected pages call this. Returns the Supabase user, or redirects to index.html.
  async function requireUser() {
    const session = await getSession();
    if (!session) { location.replace('index.html'); return null; }
    watchSignOut();
    return session.user;
  }

  // Pages that guests may open call this. Returns the user, or null (no redirect).
  async function optionalUser() {
    const session = await getSession();
    if (session) watchSignOut();
    return session ? session.user : null;
  }

  async function getProfile(userId) {
    if (!client) return null;
    let id = userId;
    if (!id) {
      const s = await getSession();
      id = s && s.user ? s.user.id : null;
    }
    if (!id) return null;
    const { data, error } = await client
      .from('profiles')
      .select('id, full_name, username, age')
      .eq('id', id)
      .maybeSingle();
    if (error) { console.error('Profile load error:', error); return null; }
    return data;
  }

  // Admin role is stored in the database (profiles.is_admin) and can NOT be changed by the user.
  async function isAdmin(userId) {
    if (!client || !userId) return false;
    const { data, error } = await client
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();
    if (error) { console.error('Admin check error:', error); return false; }
    return !!(data && data.is_admin === true);
  }

  // Admin-only pages call this. Returns { user, profile } or redirects away.
  async function requireAdmin() {
    const user = await requireUser();
    if (!user) return null;
    if (!(await isAdmin(user.id))) { location.replace('home.html'); return null; }
    const profile = await getProfile(user.id);
    return { user, profile };
  }

  async function signOut() {
    if (client) {
      try { await client.auth.signOut(); } catch (err) { console.error(err); }
    }
    // Safety net: make sure no Supabase session token stays in this browser.
    try {
      Object.keys(localStorage)
        .filter(k => /^sb-.*-auth-token/.test(k))
        .forEach(k => localStorage.removeItem(k));
    } catch (_) {}
  }

  // Clears the OLD browser-only users store (hashed passwords) from IndexedDB.
  // Videos and playlists are NOT touched.
  function purgeLegacyUsers() {
    try {
      const req = indexedDB.open('NowEnjoyMediaDB', 1);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('users')) d.createObjectStore('users', { keyPath: 'username' });
        if (!d.objectStoreNames.contains('playlists')) d.createObjectStore('playlists', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('videos')) d.createObjectStore('videos', { keyPath: 'id' });
      };
      req.onsuccess = e => {
        const d = e.target.result;
        try {
          if (d.objectStoreNames.contains('users')) {
            d.transaction('users', 'readwrite').objectStore('users').clear();
          }
        } catch (_) {}
        d.close();
      };
      req.onerror = () => {};
    } catch (_) {}
  }

  window.NowEnjoyAuth = {
    ready: !!client,
    client,
    getSession,
    requireUser,
    optionalUser,
    requireAdmin,
    getProfile,
    isAdmin,
    signOut,
    purgeLegacyUsers
  };
})();


/* NOW ENJOY - data layer: details in Supabase, files in Cloudflare R2 (through /api functions). */
(() => {
  'use strict';

  const auth = window.NowEnjoyAuth;
  const sb = auth && auth.client;
  const CHUNK = 8 * 1024 * 1024; // 8 MB per upload request
  const EXT = {
    'video/mp4': 'mp4', 'video/webm': 'webm',
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif'
  };

  async function token() {
    const s = await auth.getSession();
    if (!s) { location.replace('index.html'); throw new Error('Please login again.'); }
    return s.access_token;
  }

  // Media files are public: no login token in the URL any more.
  const mediaUrl = key => (key ? '/api/media/' + key : '');

  async function check(res) {
    if (res.ok) return res;
    let msg = 'Request failed (' + res.status + ').';
    try { const j = await res.json(); if (j && j.error) msg = j.error; } catch (_) {}
    throw new Error(msg);
  }

  const mapVideo = (r, t) => ({
    id: r.id, title: r.title,
    thumbnail: mediaUrl(r.thumb_key, t), videoUrl: mediaUrl(r.video_key, t),
    playlistId: r.playlist_id,
    category: r.category,
    views: r.views, likes: r.likes, dislikes: r.dislikes,
    uploadedBy: r.uploaded_by, uploadedAt: r.created_at
  });

  const mapPlaylist = (r, t) => ({
    id: r.id, title: r.title, cover: mediaUrl(r.cover_key, t),
    createdBy: r.created_by, createdAt: r.created_at
  });

  async function listVideos() {
    const t = null; // guests may read too
    const { data, error } = await sb.from('videos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(r => mapVideo(r, t));
  }

  async function listPlaylists() {
    const t = null; // guests may read too
    const { data, error } = await sb.from('playlists').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(r => mapPlaylist(r, t));
  }

  async function createVideo(row) {
    const { error } = await sb.from('videos').insert(row);
    if (error) throw error;
  }

  async function createPlaylist(row) {
    const { error } = await sb.from('playlists').insert(row);
    if (error) throw error;
  }

  async function addView(id) {
    const { data, error } = await sb.rpc('increment_views', { p_video: id });
    if (error) throw error;
    return data;
  }

  async function myReaction(id) {
    const { data, error } = await sb.from('video_reactions').select('reaction').eq('video_id', id).maybeSingle();
    if (error) return null;
    return data ? data.reaction : null;
  }

  async function react(id, reaction) {
    const { data, error } = await sb.rpc('react_video', { p_video: id, p_reaction: reaction });
    if (error) throw error;
    return data; // { likes, dislikes, my }
  }

  // Uploads a file to R2 and returns its key (the file's name inside the bucket).
  async function uploadFile(file, folder, onProgress) {
    const ext = EXT[file.type];
    if (!ext) throw new Error('This file type is not allowed.');
    const key = folder + '/' + crypto.randomUUID() + '.' + ext;

    const api = async (query, init) => {
      const t = await token();
      const headers = Object.assign({ Authorization: 'Bearer ' + t }, (init && init.headers) || {});
      return fetch('/api/upload?' + new URLSearchParams(query), Object.assign({}, init, { headers }));
    };

    if (file.size <= CHUNK) {
      await check(await api({ action: 'put', key }, { method: 'PUT', body: file }));
      if (onProgress) onProgress(100);
      return key;
    }

    const created = await check(await api({ action: 'create', key }, { method: 'POST' }));
    const { uploadId } = await created.json();
    const parts = [];
    try {
      const total = Math.ceil(file.size / CHUNK);
      for (let i = 0; i < total; i++) {
        const body = file.slice(i * CHUNK, (i + 1) * CHUNK);
        let res, tries = 0;
        for (;;) {
          try {
            res = await check(await api({ action: 'part', key, uploadId, n: i + 1 }, { method: 'PUT', body }));
            break;
          } catch (err) {
            if (++tries >= 3) throw err;
          }
        }
        parts.push(await res.json());
        if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
      }
      await check(await api({ action: 'complete', key, uploadId }, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parts })
      }));
    } catch (err) {
      try { await api({ action: 'abort', key, uploadId }, { method: 'POST' }); } catch (_) {}
      throw err;
    }
    return key;
  }

  // Removes a file that was uploaded but never saved in the database (admin only, checked on the server).
  async function discardFile(key) {
    try {
      const t = await token();
      await fetch('/api/upload?' + new URLSearchParams({ action: 'discard', key }), {
        method: 'POST', headers: { Authorization: 'Bearer ' + t }, keepalive: true
      });
    } catch (_) {}
  }

  // Asks the server to delete R2 files that no video / playlist uses (admin only, runs quietly).
  async function cleanup() {
    try {
      const t = await token();
      await fetch('/api/cleanup', { method: 'POST', headers: { Authorization: 'Bearer ' + t } });
    } catch (_) {}
  }

  // Deletes the row and the R2 files (admin only, checked on the server).
  async function remove(table, id) {
    const t = await token();
    await check(await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
      body: JSON.stringify({ table, id })
    }));
  }

  window.NowEnjoyData = {
    listVideos, listPlaylists, createVideo, createPlaylist,
    addView, myReaction, react, uploadFile, discardFile, cleanup, remove
  };
})();
