/* NOW ENJOY - video page script */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        gothic: ['Orbitron', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
        sans: ['Outfit', 'sans-serif']
      },
      colors: {
        crimson: {
          400: '#ff2a55',
          500: '#ff0033',
          600: '#cc0028',
          800: '#800014',
          900: '#4a000b'
        },
        obsidian: '#050307',
        darkcard: '#0d070f'
      }
    }
  }
};

(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  function startParticles() {
    const canvas = $('particles-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 100;
        this.size = Math.random() * 2.2 + 0.6;
        this.speedY = Math.random() * 1.2 + 0.4;
        this.speedX = (Math.random() - 0.5) * 0.6;
        this.opacity = Math.random() * 0.8 + 0.2;
      }
      update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < -10) this.reset();
      }
      draw() {
        ctx.fillStyle = `rgba(255,0,51,${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ff0033';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    function resize() {
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      particles = Array.from(
        { length: Math.min(Math.floor(innerWidth / 18), 70) },
        () => new Particle()
      );
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }

    addEventListener('resize', resize);
    resize();
    animate();
  }

  const DB_NAME = 'NowEnjoyMediaDB';
  const DB_VERSION = 1;
  let db;

  const initDB = () => new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('users')) d.createObjectStore('users', { keyPath: 'username' });
      if (!d.objectStoreNames.contains('playlists')) d.createObjectStore('playlists', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('videos')) d.createObjectStore('videos', { keyPath: 'id' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });

  const dbGetAll = store => new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const SESSION_KEY = 'now_enjoy_session_user';
  const session = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  };

  const requireUser = () => {
    if (!session()) { location.replace('index.html'); return false; }
    return true;
  };

  const dbPut = (store, item) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });

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


  let currentVideo = null;
  let activeVideoUrl = '';
  let currentReaction = null; // 'like' | 'dislike' | null (this visit only)

  function renderReaction() {
    setText('playerLikesCount', Number(currentVideo.likes) || 0);
    setText('playerDislikesCount', Number(currentVideo.dislikes) || 0);
    $('btnLikeVideo').classList.toggle('reaction-active', currentReaction === 'like');
    $('btnDislikeVideo').classList.toggle('reaction-active', currentReaction === 'dislike');
    $('btnLikeVideo').setAttribute('aria-pressed', String(currentReaction === 'like'));
    $('btnDislikeVideo').setAttribute('aria-pressed', String(currentReaction === 'dislike'));
  }

  async function react(type) {
    if (!currentVideo) return;
    const dec = key => { currentVideo[key] = Math.max(0, (Number(currentVideo[key]) || 0) - 1); };
    const inc = key => { currentVideo[key] = (Number(currentVideo[key]) || 0) + 1; };
    const keyOf = t => (t === 'like' ? 'likes' : 'dislikes');

    if (currentReaction === type) {
      dec(keyOf(type));
      currentReaction = null;
    } else {
      if (currentReaction) dec(keyOf(currentReaction));
      currentReaction = type;
      inc(keyOf(type));
    }
    renderReaction();
    try { await dbPut('videos', currentVideo); } catch (err) { console.error(err); }
  }

  async function initVideoPage() {
    const id = new URLSearchParams(location.search).get('id');
    const vids = await dbGetAll('videos');
    currentVideo = vids.find(v => v.id === id);
    if (!currentVideo) { setText('playerVideoTitle', 'Video not found'); return; }

    currentVideo.views = (Number(currentVideo.views) || 0) + 1;
    await dbPut('videos', currentVideo);
    setText('playerVideoTitle', currentVideo.title);
    setText('playerViewsCount', `${currentVideo.views} Views`);
    renderReaction();

    if (currentVideo.videoBlob instanceof Blob) {
      activeVideoUrl = URL.createObjectURL(currentVideo.videoBlob);
      $('mainVideoElement').src = activeVideoUrl;
    }

    $('relatedVideosContainer').innerHTML =
      vids.filter(v => v.id !== id).slice(0, 4).map(cardVideo).join('');
  }

  async function init() {
    if (!requireUser()) return;
    startParticles();
    await initDB();
    await initVideoPage();
    setupCardClicks();
    $('btnLikeVideo').onclick = () => react('like');
    $('btnDislikeVideo').onclick = () => react('dislike');
  }

  addEventListener('beforeunload', () => { if (activeVideoUrl) URL.revokeObjectURL(activeVideoUrl); });

  ready(() => init().catch(err => {
    console.error(err);
    if (!session()) location.replace('index.html');
    else alert('Could not initialize browser storage. Please use a modern browser with IndexedDB enabled.');
  }));

})();
