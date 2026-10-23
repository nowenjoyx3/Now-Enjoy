/* NOW ENJOY - upload-video page script */
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


  let tempThumb = '';
  let tempVideo = null;

  async function init() {
    if (!requireUser()) return;
    startParticles();
    await initDB();

    previewFile('videoThumbInput', 'videoThumbPreview', v => { tempThumb = v; });

    const vf = $('videoFileInput');
    vf.onchange = e => {
      tempVideo = e.target.files?.[0] || null;
      if (tempVideo && tempVideo.size > 250 * 1024 * 1024) {
        alert('Please choose a video smaller than 250 MB for this browser demo.');
        tempVideo = null;
        vf.value = '';
      }
    };

    const pls = await dbGetAll('playlists');
    $('videoPlaylistSelect').innerHTML =
      '<option value="">-- No Playlist (General Library) --</option>' +
      pls.map(p => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');

    $('formUploadVideo').onsubmit = async e => {
      e.preventDefault();
      const title = $('videoTitleInput').value.trim();
      const playlistId = $('videoPlaylistSelect').value;
      if (!title || !tempThumb || !tempVideo) {
        setText('uploadStatus', 'Thumbnail, video file, and title are required.');
        return;
      }
      try {
        await dbPut('videos', {
          id: 'vid_' + crypto.randomUUID(),
          title,
          thumbnail: tempThumb,
          videoBlob: tempVideo,
          views: 0,
          likes: 0,
          dislikes: 0,
          playlistId: playlistId || null,
          uploadedAt: new Date().toISOString(),
          uploadedBy: session().username
        });
        setText('uploadStatus', 'Video uploaded successfully!');
        e.target.reset();
        tempThumb = '';
        tempVideo = null;
        hide('videoThumbPreview');
        setTimeout(() => { location.href = 'home.html'; }, 500);
      } catch (err) {
        setText('uploadStatus', 'Video could not be saved. Browser storage may be full. Try a smaller video.');
        console.error(err);
      }
    };
  }

  ready(() => init().catch(err => {
    console.error(err);
    if (!session()) location.replace('index.html');
    else alert('Could not initialize browser storage. Please use a modern browser with IndexedDB enabled.');
  }));

})();
