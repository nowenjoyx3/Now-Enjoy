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
    requireAdmin,
    getProfile,
    isAdmin,
    signOut,
    purgeLegacyUsers
  };
})();

