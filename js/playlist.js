/* NOW ENJOY - playlist page script */
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

  // Login is handled by Supabase Auth (see js/supabase-client.js).

  function cardVideo(v) {
    return `<article class="gothic-frame media-card" tabindex="0" role="link" data-play-video="${esc(v.slug)}"><img src="${v.thumbnail}" alt="${esc(v.title)} thumbnail"><h3>${esc(v.title)}</h3><p>${Number(v.views) || 0} Views</p></article>`;
  }

  function setupCardClicks() {
    document.addEventListener('click', e => {
      const v = e.target.closest('[data-play-video]');
      if (v) { location.href = 'video.html?id=' + encodeURIComponent(v.dataset.playVideo); return; }
      const p = e.target.closest('[data-open-playlist]');
      if (p) location.href = 'playlist.html?id=' + encodeURIComponent(p.dataset.openPlaylist);
    });
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-play-video],[data-open-playlist]')) {
        e.preventDefault();
        e.target.click();
      }
    });
  }


  async function renderPlaylistDetail() {
    const header = $('playlistDetailHeader');
    const param = new URLSearchParams(location.search).get('id') || '';
    const [pls, vids] = await Promise.all([dbGetAll('playlists'), dbGetAll('videos')]);
    const p = pls.find(x => x.slug === param.toLowerCase()) || pls.find(x => x.id === param);

    if (!p) {
      header.innerHTML = '<p class="text-gray-400 text-sm">Playlist not found.</p>';
      return;
    }

    const id = p.id;
    if (param !== p.slug) {
      // old id link: show the title link in the address bar
      try {
        const qs = new URLSearchParams(location.search);
        qs.set('id', p.slug);
        history.replaceState(null, '', location.pathname + '?' + qs.toString() + location.hash);
      } catch (_) {}
    }

    const list = vids.filter(v => v.playlistId === id);
    header.innerHTML = `<img src="${p.cover}" alt="" class="w-32 h-24 object-cover rounded-xl border border-crimson-500"><div><h2 class="font-cinzel text-2xl font-bold text-white">${esc(p.title)}</h2><p class="text-xs text-crimson-400 font-gothic mt-1">${list.length} Videos</p></div>`;
    $('playlistVideosContainer').innerHTML = list.map(cardVideo).join('');
    $('emptyPlaylistVideos').classList.toggle('hidden', list.length > 0);
  }

  async function init() {
    const authUser = await NowEnjoyAuth.optionalUser();
    if (!authUser) NowEnjoyUI.markGuestHeader();
    startParticles();
    await initDB();
    await renderPlaylistDetail();
    setupCardClicks();
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
