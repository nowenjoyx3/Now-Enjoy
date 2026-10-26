/* NOW ENJOY - delete-playlist page script */
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

  // Admin-only page: the role is checked against Supabase (profiles.is_admin).
  const requireUser = () => NowEnjoyAuth.requireAdmin();

  const dbDelete = (store, id) => Data.remove(store === 'videos' ? 'videos' : 'playlists', id);

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };

  const hide = id => { if ($(id)) $(id).classList.add('hidden'); };


  const TYPE = 'playlist';
  const STORE = 'playlists';
  let deleteTarget = null;

  function deleteRow(item) {
    return `<div class="delete-row"><div class="flex items-center gap-3 min-w-0"><img src="${item.cover || ''}" alt=""><span class="item-name">${esc(item.title)}</span></div><button type="button" data-delete-id="${esc(item.id)}" aria-label="Delete ${esc(item.title)}"><i class="fa-solid fa-trash-can"></i></button></div>`;
  }

  async function loadDeleteList() {
    const items = await dbGetAll(STORE);
    $('deletePlaylistsList').innerHTML = items.map(deleteRow).join('');
    $('emptyDelete').classList.toggle('hidden', items.length > 0);
  }

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    await loadDeleteList();

    document.addEventListener('click', e => {
      const b = e.target.closest('[data-delete-id]');
      if (!b) return;
      deleteTarget = b.dataset.deleteId;
      setText('confirmDeleteText', `Are you sure you want to permanently delete this ${TYPE}?`);
      $('confirmDeleteModal').classList.remove('hidden');
    });

    $('btnConfirmDeleteCancel').onclick = () => {
      deleteTarget = null;
      hide('confirmDeleteModal');
    };

    $('btnConfirmDeleteYes').onclick = async () => {
      if (!deleteTarget) return;
      try {
        await dbDelete(STORE, deleteTarget);
        deleteTarget = null;
        hide('confirmDeleteModal');
        await loadDeleteList();
      } catch (err) {
        alert('Delete failed.');
        console.error(err);
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
