/* NOW ENJOY - video page script */
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

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };

  function cardVideo(v) {
    return `<article class="gothic-frame media-card" tabindex="0" role="link" data-play-video="${esc(v.id)}"><img src="${v.thumbnail}" alt="${esc(v.title)} thumbnail"><h3>${esc(v.title)}</h3><p>${Number(v.views) || 0} Views</p></article>`;
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


  // Custom player (Plyr): play, +-10s, progress, time, volume, speed, loop, picture-in-picture, fullscreen.
  // There is NO download button, and the browser's own download / right-click menu is switched off.
  function setupPlayer(video) {
    video.addEventListener('contextmenu', e => e.preventDefault());
    if (typeof Plyr !== 'function') return; // library not loaded: the normal browser player still works
    const player = new Plyr(video, {
      controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration',
                 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
      settings: ['speed', 'loop'],
      speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
      seekTime: 10,
      keyboard: { focused: true, global: true },
      tooltips: { controls: true, seek: true }
    });
    player.elements.container.addEventListener('contextmenu', e => e.preventDefault());
  }

  // "Playlist" bar under the views: shows the playlist name and all its videos (newest first).
  async function renderPlaylistPanel(vids) {
    const pid = currentVideo.playlistId;
    if (!pid) return;
    let title = 'Playlist';
    try {
      const pls = await Data.listPlaylists();
      const p = pls.find(x => x.id === pid);
      if (p) title = p.title;
    } catch (err) { console.error(err); }

    const list = vids.filter(v => v.playlistId === pid);
    $('playlistName').textContent = title;
    $('playlistItems').innerHTML = list.map(v => {
      const now = v.id === currentVideo.id;
      return `<a class="playlist-item${now ? ' current' : ''}" href="video.html?id=${encodeURIComponent(v.id)}"${now ? ' aria-current="true"' : ''}><img src="${esc(v.thumbnail)}" alt=""><span class="pi-title">${esc(v.title)}</span>${now ? '<span class="pi-now">NOW PLAYING</span>' : ''}</a>`;
    }).join('');
    $('playlistPanel').classList.remove('hidden');

    const toggle = $('playlistToggle'), body = $('playlistBody');
    toggle.onclick = () => {
      const open = body.classList.toggle('hidden') === false;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.classList.toggle('open', open);
    };
  }

  let currentVideo = null;
  let currentReaction = null; // 'like' | 'dislike' | null
  let isLoggedIn = false;

  function renderReaction() {
    setText('playerLikesCount', Number(currentVideo.likes) || 0);
    setText('playerDislikesCount', Number(currentVideo.dislikes) || 0);
    $('btnLikeVideo').classList.toggle('reaction-active', currentReaction === 'like');
    $('btnDislikeVideo').classList.toggle('reaction-active', currentReaction === 'dislike');
    $('btnLikeVideo').setAttribute('aria-pressed', String(currentReaction === 'like'));
    $('btnDislikeVideo').setAttribute('aria-pressed', String(currentReaction === 'dislike'));
  }

  let reacting = false;
  async function react(type) {
    if (!currentVideo || reacting) return;
    if (!isLoggedIn) { location.href = 'index.html'; return; }
    reacting = true;
    try {
      const res = await Data.react(currentVideo.id, currentReaction === type ? 'none' : type);
      currentVideo.likes = res.likes;
      currentVideo.dislikes = res.dislikes;
      currentReaction = res.my || null;
      renderReaction();
    } catch (err) {
      console.error(err);
      alert('Could not save your reaction. Please try again.');
    } finally {
      reacting = false;
    }
  }

  async function initVideoPage() {
    const id = new URLSearchParams(location.search).get('id');
    const vids = await Data.listVideos();
    currentVideo = vids.find(v => v.id === id);
    if (!currentVideo) { setText('playerVideoTitle', 'Video not found'); return; }

    setText('playerVideoTitle', currentVideo.title);
    try {
      const views = await Data.addView(id);
      currentVideo.views = Number(views) || (Number(currentVideo.views) || 0) + 1;
    } catch (err) { console.error(err); }
    setText('playerViewsCount', `${currentVideo.views} Views`);
    currentReaction = isLoggedIn ? await Data.myReaction(id) : null;
    renderReaction();

    const videoEl = $('mainVideoElement');
    videoEl.src = currentVideo.videoUrl;
    setupPlayer(videoEl);
    $('relatedVideosContainer').innerHTML =
      vids.filter(v => v.id !== id)
        .map(v => [v, (v.playlistId && v.playlistId === currentVideo.playlistId ? 2 : 0) + (v.category && v.category === currentVideo.category ? 1 : 0)])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(x => cardVideo(x[0]))
        .join('');
    await renderPlaylistPanel(vids);
  }

  async function init() {
    const authUser = await NowEnjoyAuth.optionalUser();
    if (!authUser) NowEnjoyUI.markGuestHeader();
    isLoggedIn = !!authUser;
    startParticles();
    await initDB();
    await initVideoPage();
    setupCardClicks();
    $('btnLikeVideo').onclick = () => react('like');
    $('btnDislikeVideo').onclick = () => react('dislike');
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
