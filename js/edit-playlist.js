/* NOW ENJOY - edit-playlist page script (admin only)
   edit-playlist.html           -> list of playlists
   edit-playlist.html?id=<id>   -> edit that playlist */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const { startParticles, esc } = window.NowEnjoyUI;
  const Data = window.NowEnjoyData;

  const MAX_IMAGE = 12 * 1024 * 1024; // 12 MB

  const setStatus = (msg, ok) => {
    const el = $('editStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ok', !!ok);
  };

  /* ------------------------------------------------------------------ list */

  async function showList() {
    const [playlists, videos] = await Promise.all([Data.listPlaylists(), Data.listVideos()]);
    const count = {};
    videos.forEach(v => { if (v.playlistId) count[v.playlistId] = (count[v.playlistId] || 0) + 1; });

    const row = p => `<div class="edit-row">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${esc(p.cover)}" alt="">
        <span class="item-name">${esc(p.title)}<span class="item-sub">${count[p.id] || 0} video(s)</span></span>
      </div>
      <button type="button" class="go" data-edit-id="${esc(p.id)}"><i class="fa-solid fa-pen-to-square mr-1"></i> EDIT</button>
    </div>`;

    const render = () => {
      const q = $('listSearch').value.trim().toLowerCase();
      const shown = playlists.filter(p => !q || String(p.title || '').toLowerCase().includes(q));
      $('editPlaylistsList').innerHTML = shown.map(row).join('');
      $('emptyList').textContent = playlists.length ? 'No playlist matches your search.' : 'Nothing to edit yet.';
      $('emptyList').classList.toggle('hidden', shown.length > 0);
    };

    $('listSearch').oninput = render;
    $('editPlaylistsList').onclick = e => {
      const b = e.target.closest('[data-edit-id]');
      if (b) location.href = 'edit-playlist.html?id=' + encodeURIComponent(b.dataset.editId);
    };
    render();
  }

  /* ---------------------------------------------------------------- editor */

  let state = null; // { playlist, members, others, names }
  const removeIds = new Set(); // members taken out of this playlist
  const addIds = new Set();    // videos moved into this playlist

  function renderMembers() {
    const html = state.members.map(v => {
      const gone = removeIds.has(v.id);
      return `<div class="member-row${gone ? ' removed' : ''}">
        <img src="${esc(v.thumbnail)}" alt="">
        <span class="item-name">${esc(v.title)}</span>
        <button type="button" class="mini-btn" data-toggle-id="${esc(v.id)}">${gone ? 'UNDO' : 'REMOVE'}</button>
      </div>`;
    }).join('');
    $('memberList').innerHTML = html;
    $('noMemberNote').classList.toggle('hidden', state.members.length > 0);
  }

  function renderAddList() {
    const q = $('addSearch').value.trim().toLowerCase();
    const shown = state.others.filter(v => !q || String(v.title || '').toLowerCase().includes(q));
    $('addList').innerHTML = shown.map(v => {
      const where = v.playlistId ? 'Now in: ' + (state.names[v.playlistId] || 'another playlist') : 'No playlist';
      return `<label class="member-row pick-row">
        <input type="checkbox" data-add-id="${esc(v.id)}"${addIds.has(v.id) ? ' checked' : ''}>
        <img src="${esc(v.thumbnail)}" alt="">
        <span class="item-name">${esc(v.title)}<span class="item-sub">${esc(where)}</span></span>
      </label>`;
    }).join('');
    $('noAddNote').classList.toggle('hidden', shown.length > 0);
  }

  function previewCover() {
    const input = $('editCoverInput');
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      const box = $('editCoverPreview');
      if (!file) { box.classList.add('hidden'); return; }
      if (file.size > MAX_IMAGE) {
        alert('Please choose an image smaller than 12 MB.');
        input.value = '';
        box.classList.add('hidden');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        box.querySelector('img').src = ev.target.result;
        box.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    };
  }

  async function showEditor(id) {
    const [playlists, videos] = await Promise.all([Data.listPlaylists(), Data.listVideos()]);
    const playlist = playlists.find(p => String(p.id) === String(id));
    if (!playlist) {
      alert('Playlist not found.');
      location.replace('edit-playlist.html');
      return;
    }
    const names = {};
    playlists.forEach(p => { names[p.id] = p.title; });
    state = {
      playlist,
      names,
      members: videos.filter(v => String(v.playlistId) === String(playlist.id)),
      others: videos.filter(v => String(v.playlistId) !== String(playlist.id))
    };

    $('viewList').classList.add('hidden');
    $('viewEdit').classList.remove('hidden');

    $('editTitle').value = playlist.title || '';
    $('editCoverCurrent').querySelector('img').src = playlist.cover;
    previewCover();

    renderMembers();
    renderAddList();

    $('memberList').onclick = e => {
      const b = e.target.closest('[data-toggle-id]');
      if (!b) return;
      const vid = b.dataset.toggleId;
      if (removeIds.has(vid)) removeIds.delete(vid); else removeIds.add(vid);
      renderMembers();
    };
    $('addSearch').oninput = renderAddList;
    $('addList').onchange = e => {
      const c = e.target.closest('[data-add-id]');
      if (!c) return;
      if (c.checked) addIds.add(c.dataset.addId); else addIds.delete(c.dataset.addId);
    };

    $('formEditPlaylist').onsubmit = e => { e.preventDefault(); save(); };
  }

  async function save() {
    const btn = $('btnSave');
    const playlist = state.playlist;
    const title = $('editTitle').value.trim();
    const coverFile = $('editCoverInput').files[0] || null;

    if (!title) { setStatus('Title is required.'); return; }
    if (coverFile && coverFile.size > MAX_IMAGE) { setStatus('Please choose a cover smaller than 12 MB.'); return; }

    let newCover = null;
    let changed = false;
    btn.disabled = true;
    setStatus('');
    try {
      if (coverFile) {
        setStatus('Uploading cover... 0%');
        newCover = await Data.uploadFile(coverFile, 'covers', pct => setStatus('Uploading cover... ' + pct + '%'));
      }

      const fields = {};
      if (title !== playlist.title) fields.title = title;
      if (newCover) fields.cover_key = newCover;
      if (Object.keys(fields).length) {
        setStatus('Saving playlist...');
        await Data.updatePlaylist(playlist.id, fields);
        changed = true;
        if (newCover && playlist.coverKey) Data.discardFile(playlist.coverKey);
        newCover = null; // now used by the database, do not discard below
      }

      const toRemove = [...removeIds];
      if (toRemove.length) {
        setStatus('Removing videos from the playlist...');
        await Data.setVideosPlaylist(toRemove, null);
        changed = true;
      }

      const toAdd = [...addIds];
      if (toAdd.length) {
        setStatus('Adding videos to the playlist...');
        await Data.setVideosPlaylist(toAdd, playlist.id);
        changed = true;
      }

      if (!changed) {
        setStatus('Nothing was changed.');
        btn.disabled = false;
        return;
      }
      setStatus('Saved successfully!', true);
      setTimeout(() => { location.href = 'edit-playlist.html?id=' + encodeURIComponent(playlist.id); }, 800);
    } catch (err) {
      console.error(err);
      if (newCover) Data.discardFile(newCover);
      setStatus((changed ? 'Some changes were saved, but not all: ' : 'Could not save: ') +
        ((err && err.message) || 'please try again.') +
        (changed ? ' Reload the page to see the current state.' : ''));
      btn.disabled = false;
    }
  }

  async function init() {
    const authUser = await NowEnjoyAuth.requireAdmin();
    if (!authUser) return;
    startParticles();
    Data.cleanup(); // quietly removes leftover files from R2
    const id = new URLSearchParams(location.search).get('id');
    if (id) await showEditor(id);
    else await showList();
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
