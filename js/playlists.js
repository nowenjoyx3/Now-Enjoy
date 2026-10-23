/* NOW ENJOY - playlists page script */
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

  // Login is handled by Supabase Auth (see js/supabase-client.js).
  const requireUser = () => NowEnjoyAuth.requireUser();

  function cardPlaylist(p, count) {
    return `<article class="gothic-frame media-card" tabindex="0" role="link" data-open-playlist="${esc(p.id)}"><img src="${p.cover}" alt="${esc(p.title)} cover"><h3>${esc(p.title)}</h3><p>${count} Videos</p></article>`;
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


  async function loadPlaylists() {
    const box = $('playlistCardsContainer');
    const [pls, vids] = await Promise.all([dbGetAll('playlists'), dbGetAll('videos')]);
    box.innerHTML = pls.map(p => cardPlaylist(p, vids.filter(v => v.playlistId === p.id).length)).join('');
    $('emptyPlaylists').classList.toggle('hidden', pls.length > 0);
  }

  // Filters the playlist cards that are already rendered.
  function setupPlaylistSearch() {
    const input = $('playlistSearchInput');
    const container = $('playlistCardsContainer');
    const emptyMessage = $('emptyPlaylists');
    const noResultsMessage = $('noPlaylistSearchResults');
    const normalize = value => (value || '').toLocaleLowerCase().trim();

    function filterPlaylists() {
      const query = normalize(input.value);
      const cards = Array.from(container.children).filter(el => el.nodeType === 1 && el !== emptyMessage);
      let visibleCount = 0;

      cards.forEach(card => {
        const matches = !query || normalize(card.innerText || card.textContent).includes(query);
        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      noResultsMessage.classList.toggle('hidden', !query || visibleCount > 0);
      emptyMessage.classList.toggle('hidden', cards.length > 0 || Boolean(query));
    }

    input.addEventListener('input', filterPlaylists);
    new MutationObserver(filterPlaylists).observe(container, {
      childList: true, subtree: true, characterData: true
    });
    filterPlaylists();
  }

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    setupPlaylistSearch();
    await initDB();
    await loadPlaylists();
    setupCardClicks();
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not initialize browser storage. Please use a modern browser with IndexedDB enabled.');
  }));

})();
