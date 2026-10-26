/* NOW ENJOY - create-playlist page script */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const { startParticles } = window.NowEnjoyUI;

  // Data now lives in Supabase (details) and Cloudflare R2 (files). See js/supabase-client.js.
  const Data = window.NowEnjoyData;
  const initDB = async () => {};
  const dbGetAll = store => (store === 'videos' ? Data.listVideos() : Data.listPlaylists());

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Admin-only page: the role is checked against Supabase (profiles.is_admin).
  const requireUser = () => NowEnjoyAuth.requireAdmin();

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };

  const hide = id => { if ($(id)) $(id).classList.add('hidden'); };

  function previewFile(inputId, previewId, setter) {
    const input = $(inputId);
    if (!input) return;
    input.onchange = e => {
      const file = e.target.files?.[0];
      if (!file) { setter(''); hide(previewId); return; }
      if (file.size > 12 * 1024 * 1024 && file.type.startsWith('image/')) {
        alert('Please choose an image smaller than 12 MB.');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        setter(ev.target.result);
        const img = $(previewId)?.querySelector('img');
        if (img) img.src = ev.target.result;
        $(previewId)?.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    };
  }


  let tempCover = '';

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    Data.cleanup(); // quietly removes leftover files from R2

    previewFile('playlistCoverInput', 'playlistCoverPreview', v => { tempCover = v; });

    $('formCreatePlaylist').onsubmit = async e => {
      e.preventDefault();
      const form = e.target;
      const button = form.querySelector('button[type="submit"]');
      const title = $('playlistTitleInput').value.trim();
      const coverFile = $('playlistCoverInput').files && $('playlistCoverInput').files[0];
      if (!title || !coverFile) {
        setText('createStatus', 'Please provide a cover image and playlist title.');
        return;
      }
      let coverKey = null;
      button.disabled = true;
      try {
        setText('createStatus', 'Uploading cover...');
        coverKey = await Data.uploadFile(coverFile, 'covers');
        setText('createStatus', 'Saving playlist...');
        await Data.createPlaylist({
          id: crypto.randomUUID(),
          title,
          cover_key: coverKey,
          created_by: (authUser.profile && authUser.profile.username) || authUser.user.email
        });
        setText('createStatus', 'Playlist created successfully!');
        form.reset();
        tempCover = '';
        hide('playlistCoverPreview');
        setTimeout(() => { location.href = 'playlists.html'; }, 600);
      } catch (err) {
        console.error(err);
        if (coverKey) Data.discardFile(coverKey);
        setText('createStatus', 'Could not create playlist: ' + ((err && err.message) || 'please try again.'));
      } finally {
        button.disabled = false;
      }
    };
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
