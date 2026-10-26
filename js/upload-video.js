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


  let tempThumb = '';
  let tempVideo = null;

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();

    previewFile('videoThumbInput', 'videoThumbPreview', v => { tempThumb = v; });

    const vf = $('videoFileInput');
    vf.onchange = e => {
      tempVideo = e.target.files?.[0] || null;
      if (tempVideo && tempVideo.size > 250 * 1024 * 1024) {
        alert('Please choose a video smaller than 250 MB.');
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
      const form = e.target;
      const button = form.querySelector('button[type="submit"]');
      const title = $('videoTitleInput').value.trim();
      const playlistId = $('videoPlaylistSelect').value;
      const category = $('videoCategorySelect').value;
      const thumbFile = $('videoThumbInput').files && $('videoThumbInput').files[0];
      if (!title || !thumbFile || !tempVideo) {
        setText('uploadStatus', 'Thumbnail, video file, and title are required.');
        return;
      }
      if (!category) {
        setText('uploadStatus', 'Please select a category.');
        return;
      }
      button.disabled = true;
      try {
        setText('uploadStatus', 'Uploading thumbnail...');
        const thumbKey = await Data.uploadFile(thumbFile, 'thumbs');
        setText('uploadStatus', 'Uploading video... 0%');
        const videoKey = await Data.uploadFile(tempVideo, 'videos', pct => setText('uploadStatus', 'Uploading video... ' + pct + '%'));
        setText('uploadStatus', 'Saving details...');
        await Data.createVideo({
          id: 'vid_' + crypto.randomUUID(),
          title,
          thumb_key: thumbKey,
          video_key: videoKey,
          playlist_id: playlistId || null,
          category,
          uploaded_by: (authUser.profile && authUser.profile.username) || authUser.user.email
        });
        setText('uploadStatus', 'Video uploaded successfully!');
        form.reset();
        tempThumb = '';
        tempVideo = null;
        hide('videoThumbPreview');
        setTimeout(() => { location.href = 'home.html'; }, 600);
      } catch (err) {
        console.error(err);
        setText('uploadStatus', 'Upload failed: ' + ((err && err.message) || 'please try again.'));
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
