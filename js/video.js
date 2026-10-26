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

  // Data now lives in Supabase (details) and Cloudflare R2 (files). See js/supabase-client.js.
  const Data = window.NowEnjoyData;
  const initDB = async () => {};
  const dbGetAll = store => (store === 'videos' ? Data.listVideos() : Data.listPlaylists());

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  // Login is handled by Supabase Auth (see js/supabase-client.js).
  const requireUser = () => NowEnjoyAuth.requireUser();

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
  let currentReaction = null; // 'like' | 'dislike' | null

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
    currentReaction = await Data.myReaction(id);
    renderReaction();

    $('mainVideoElement').src = currentVideo.videoUrl;
    $('relatedVideosContainer').innerHTML =
      vids.filter(v => v.id !== id).slice(0, 4).map(cardVideo).join('');
  }

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    await initVideoPage();
    setupCardClicks();
    $('btnLikeVideo').onclick = () => react('like');
    $('btnDislikeVideo').onclick = () => react('dislike');
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
