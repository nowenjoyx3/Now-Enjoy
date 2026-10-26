/* NOW ENJOY - home page script */
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

  // Data now lives in Supabase (details) and Cloudflare R2 (files). See js/supabase-client.js.
  const Data = window.NowEnjoyData;
  const initDB = async () => {};
  const dbGetAll = store => (store === 'videos' ? Data.listVideos() : Data.listPlaylists());

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Login is handled by Supabase Auth (see js/supabase-client.js).
  const requireUser = () => NowEnjoyAuth.requireUser();

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


  let currentTerm = '';

  async function loadVideos(term = currentTerm) {
    currentTerm = term;
    const box = $('videoCardsContainer');
    const all = await dbGetAll('videos');
    const list = all.filter(v =>
      (v.title || '').toLowerCase().includes(term) &&
      (selectedCats.size === 0 || selectedCats.has(v.category))
    );
    box.innerHTML = list.map(cardVideo).join('');
    $('emptyVideos').classList.toggle('hidden', list.length > 0);
  }

  // Where to send an under-18 visitor: the external page they came from,
  // otherwise the browser's blank page (a site cannot open the browser's own home page).
  function leaveSite() {
    let external = '';
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).origin !== location.origin) external = ref;
    } catch (error) {}
    location.replace(external || 'about:blank');
  }

  // Shown on every visit to the home page.
  function setupAgeVerification() {
    const popup = $('ageVerification');
    document.body.classList.add('age-locked');

    $('ageYes').addEventListener('click', () => {
      popup.classList.add('hidden');
      document.body.classList.remove('age-locked');
    });

    $('ageNo').addEventListener('click', () => {
      popup.querySelector('.age-box').innerHTML = `
        <i class="fa-solid fa-circle-exclamation age-icon"></i>
        <h2 class="age-title">ACCESS DENIED</h2>
        <p class="age-message">
          Sorry, you must be at least 18 years old to access this website.
          You will now leave this page.
        </p>
      `;
      setTimeout(leaveSite, 1800);
    });
  }

  // Selected categories from the Filter menu (empty = show everything).
  const selectedCats = new Set();

  function setupCategoryFilter(onChange) {
    const btn = $('filterBtn'), menu = $('filterMenu'), count = $('filterCount');
    if (!btn || !menu) return;
    const boxes = () => menu.querySelectorAll('input[type="checkbox"]');

    const sync = () => {
      count.textContent = selectedCats.size;
      count.classList.toggle('hidden', selectedCats.size === 0);
      btn.classList.toggle('active', selectedCats.size > 0);
    };
    const setOpen = open => {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
    };

    btn.addEventListener('click', e => { e.stopPropagation(); setOpen(menu.classList.contains('hidden')); });
    menu.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

    boxes().forEach(cb => cb.addEventListener('change', () => {
      if (cb.checked) selectedCats.add(cb.value); else selectedCats.delete(cb.value);
      sync();
      onChange();
    }));

    $('filterClear').addEventListener('click', () => {
      selectedCats.clear();
      boxes().forEach(cb => { cb.checked = false; });
      sync();
      onChange();
    });
  }

  async function init() {
    setupAgeVerification();
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    await loadVideos();
    $('searchInput').oninput = e => loadVideos(e.target.value.toLowerCase().trim());
    setupCategoryFilter(() => loadVideos());
    setupCardClicks();
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
