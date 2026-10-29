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
    if (typeof Plyr !== 'function') return null; // library not loaded: the normal browser player still works
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
    return player;
  }

  // ---- Dub / extra audio: a language button in the player controls ----
  // The video keeps playing; the chosen audio file plays on top of it (video sound is silenced through Web Audio).
  const DUB_KEY = 'ne_dub_lang'; // remembered language, stored only in this browser
  const ORIGINAL = '__original__';
  const getSaved = () => { try { return localStorage.getItem(DUB_KEY); } catch (_) { return null; } };
  const setSaved = v => { try { localStorage.setItem(DUB_KEY, v); } catch (_) {} };

  function setupDub(video, player, audios) {
    const none = { ready: Promise.resolve() };
    const controls = player && player.elements && player.elements.controls;
    if (!audios.length || !controls) return none;

    const audioEl = new Audio();
    audioEl.preload = 'auto';
    let ctx = null, gain = null, active = null;

    const wrap = document.createElement('div');
    wrap.className = 'dub-wrap';
    wrap.innerHTML =
      '<button type="button" class="plyr__control dub-btn" aria-haspopup="true" aria-expanded="false" aria-label="Audio language">' +
      '<i class="fa-solid fa-language"></i></button><div class="dub-menu hidden" role="menu"></div>';
    const btn = wrap.querySelector('.dub-btn'), menu = wrap.querySelector('.dub-menu');
    const settingsMenu = controls.querySelector('.plyr__menu');
    controls.insertBefore(wrap, settingsMenu || null);

    function renderMenu() {
      const items = [{ name: 'Original', a: null }].concat(audios.map(a => ({ name: a.name, a })));
      menu.innerHTML = items.map((it, i) =>
        `<button type="button" role="menuitemradio" data-i="${i}" aria-checked="${(it.a === active) ? 'true' : 'false'}" class="${it.a === active ? 'active' : ''}">` +
        `<span>${esc(it.name)}</span>${it.a === active ? '<i class="fa-solid fa-check"></i>' : ''}</button>`).join('');
    }

    const syncVolume = () => {
      audioEl.volume = video.volume;
      audioEl.muted = gain ? video.muted : false;
    };

    // Routes the video's own sound through a volume node so it can be switched off.
    // Only done when the browser lets audio run (otherwise the video would go silent).
    async function ensureGraph() {
      if (gain) return true;
      try {
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return false;
          ctx = new AC();
        }
        if (ctx.state !== 'running') {
          await Promise.race([ctx.resume().catch(() => {}), new Promise(r => setTimeout(r, 400))]);
        }
        if (ctx.state !== 'running') return false;
        const src = ctx.createMediaElementSource(video);
        gain = ctx.createGain();
        src.connect(gain);
        gain.connect(ctx.destination);
        return true;
      } catch (_) { return false; }
    }

    async function choose(a, fromGesture) {
      if (a) {
        const ok = await ensureGraph();
        if (!ok && !fromGesture) return false;      // not allowed yet: try again after the first tap
        if (gain) gain.gain.value = 0; else video.muted = true; // fallback: plain mute
        if (audioEl.getAttribute('src') !== a.url) audioEl.src = a.url;
        audioEl.currentTime = video.currentTime;
        audioEl.playbackRate = video.playbackRate;
        active = a;
        syncVolume();
        if (!video.paused) audioEl.play().catch(() => {});
      } else {
        active = null;
        audioEl.pause();
        if (gain) gain.gain.value = 1; else video.muted = false;
        syncVolume();
      }
      renderMenu();
      return true;
    }

    // keep the audio in step with the video
    video.addEventListener('play', () => { if (active) { audioEl.currentTime = video.currentTime; audioEl.play().catch(() => {}); } });
    video.addEventListener('playing', () => { if (active && audioEl.paused) { audioEl.currentTime = video.currentTime; audioEl.play().catch(() => {}); } });
    video.addEventListener('pause', () => audioEl.pause());
    video.addEventListener('waiting', () => audioEl.pause());
    video.addEventListener('ended', () => audioEl.pause());
    video.addEventListener('seeking', () => { if (active) audioEl.currentTime = video.currentTime; });
    video.addEventListener('ratechange', () => { audioEl.playbackRate = video.playbackRate; });
    video.addEventListener('volumechange', syncVolume);
    video.addEventListener('timeupdate', () => {
      if (active && !video.paused && Math.abs(audioEl.currentTime - video.currentTime) > 0.3) audioEl.currentTime = video.currentTime;
    });

    // menu open / close / choose
    const closeMenu = () => { menu.classList.add('hidden'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', async e => {
      e.stopPropagation();
      const b = e.target.closest('button[data-i]');
      if (!b) return;
      const i = Number(b.dataset.i);
      const a = i === 0 ? null : audios[i - 1];
      await choose(a, true);
      setSaved(a ? a.name.toLowerCase() : ORIGINAL);
      closeMenu();
    });
    document.addEventListener('click', closeMenu);
    renderMenu();

    // Remembered language: applied automatically if this video has it.
    const saved = getSaved();
    const want = saved && saved !== ORIGINAL ? audios.find(a => a.name.toLowerCase() === saved) : null;
    let ready = Promise.resolve();
    if (want) {
      ready = choose(want, false).then(ok => {
        if (ok) return;
        // The browser needs one tap first: apply the language on the first tap / key press.
        const retry = () => { choose(want, true); };
        ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, retry, { once: true }));
      });
    }
    return { ready };
  }

  // The next video of the playlist (set by renderPlaylistPanel); it starts when this one ends.
  let nextVideo = null;

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
    const at = list.findIndex(v => v.id === currentVideo.id);
    nextVideo = at >= 0 && at < list.length - 1 ? list[at + 1] : null;
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
    let audios = [];
    try { audios = await Data.listAudios(id); } catch (err) { console.error(err); }
    const player = setupPlayer(videoEl);
    const dub = setupDub(videoEl, player, audios);

    // When this video ends, the next one in the playlist starts by itself.
    videoEl.addEventListener('ended', () => {
      if (nextVideo) location.href = 'video.html?id=' + encodeURIComponent(nextVideo.id) + '&autoplay=1';
    });
    if (new URLSearchParams(location.search).get('autoplay') === '1') {
      // wait a moment for the remembered language, then play (the browser may ask for a tap)
      dub.ready.then(() => { const p = videoEl.play(); if (p && p.catch) p.catch(() => {}); });
    }
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
