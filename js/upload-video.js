/* NOW ENJOY - upload-video page script */
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

  // ---- Dub / extra audio rows ----
  const MAX_AUDIOS = 8;
  const MAX_DIFF = 0.5; // seconds: audio and video length must match within this

  function addAudioRow() {
    const box = $('audioRows');
    if (box.children.length >= MAX_AUDIOS) { alert('You can add up to ' + MAX_AUDIOS + ' audios.'); return; }
    const row = document.createElement('div');
    row.className = 'flex flex-col sm:flex-row gap-2 items-stretch audio-row';
    row.innerHTML =
      '<input type="text" maxlength="30" placeholder="Name (e.g. Hindi)" class="gothic-input px-3 py-2 rounded-xl sm:w-44 audio-name">' +
      '<input type="file" accept=".mp3,.m4a,.ogg,.wav,audio/*" class="gothic-input p-2 rounded-xl flex-1 audio-file">' +
      '<button type="button" class="gothic-input px-3 py-2 rounded-xl audio-remove" aria-label="Remove audio">X</button>';
    row.querySelector('.audio-remove').onclick = () => row.remove();
    box.appendChild(row);
  }

  // Length (seconds) of a video / audio file, read in the browser.
  function getDuration(file, tag) {
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      const url = URL.createObjectURL(file);
      const done = (fn, v) => { clearTimeout(timer); URL.revokeObjectURL(url); fn(v); };
      const timer = setTimeout(() => done(reject, new Error('Could not read the length of "' + file.name + '".')), 20000);
      el.preload = 'metadata';
      el.onloadedmetadata = () => (isFinite(el.duration) && el.duration > 0)
        ? done(resolve, el.duration)
        : done(reject, new Error('Could not read the length of "' + file.name + '".'));
      el.onerror = () => done(reject, new Error('Could not read "' + file.name + '". Use MP3, M4A, OGG or WAV.'));
      el.src = url;
    });
  }

  // Reads the audio rows. Returns [{ name, file }] or throws a message for the page.
  function readAudioRows() {
    const out = [], seen = new Set();
    document.querySelectorAll('#audioRows .audio-row').forEach(row => {
      const name = row.querySelector('.audio-name').value.trim();
      const file = row.querySelector('.audio-file').files[0] || null;
      if (!name && !file) return; // empty row is ignored
      if (!name || !file) throw new Error('Every audio needs both a name and a file.');
      const low = name.toLowerCase();
      if (low === 'original') throw new Error('The name "Original" is already used for the video\'s own sound.');
      if (seen.has(low)) throw new Error('Two audios have the same name: ' + name);
      seen.add(low);
      if (!/\.(mp3|m4a|ogg|wav)$/i.test(file.name)) throw new Error('Audio "' + name + '" must be MP3, M4A, OGG or WAV.');
      out.push({ name, file });
    });
    return out;
  }

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    Data.cleanup(); // quietly removes leftover files from R2

    previewFile('videoThumbInput', 'videoThumbPreview', v => { tempThumb = v; });

    const vf = $('videoFileInput');
    vf.onchange = e => {
      tempVideo = e.target.files?.[0] || null;
      if (tempVideo && tempVideo.size > 1024 * 1024 * 1024) {
        alert('Please choose a video smaller than 1 GB.');
        tempVideo = null;
        vf.value = '';
      }
    };

    $('btnAddAudio').onclick = addAudioRow;

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
      let audios;
      try { audios = readAudioRows(); } catch (err) { setText('uploadStatus', err.message); return; }

      let thumbKey = null, videoKey = null, videoSaved = false;
      const audioKeys = [];
      button.disabled = true;
      try {
        if (audios.length) {
          setText('uploadStatus', 'Checking audio length...');
          const vDur = await getDuration(tempVideo, 'video');
          for (const a of audios) {
            const aDur = await getDuration(a.file, 'audio');
            if (Math.abs(aDur - vDur) > MAX_DIFF) {
              throw new Error('Audio "' + a.name + '" is ' + aDur.toFixed(2) + ' s but the video is ' + vDur.toFixed(2) +
                ' s. The difference must be within ' + MAX_DIFF + ' s.');
            }
          }
        }
        setText('uploadStatus', 'Uploading thumbnail...');
        thumbKey = await Data.uploadFile(thumbFile, 'thumbs');
        setText('uploadStatus', 'Uploading video... 0%');
        videoKey = await Data.uploadFile(tempVideo, 'videos', pct => setText('uploadStatus', 'Uploading video... ' + pct + '%'));
        const videoId = crypto.randomUUID();
        for (let i = 0; i < audios.length; i++) {
          const a = audios[i];
          setText('uploadStatus', 'Uploading audio ' + (i + 1) + '/' + audios.length + ' (' + a.name + ')... 0%');
          audioKeys.push(await Data.uploadFile(a.file, 'audios', pct =>
            setText('uploadStatus', 'Uploading audio ' + (i + 1) + '/' + audios.length + ' (' + a.name + ')... ' + pct + '%')));
        }
        setText('uploadStatus', 'Saving details...');
        await Data.createVideo({
          id: videoId,
          owner_id: authUser.user.id,
          title,
          thumb_key: thumbKey,
          video_key: videoKey,
          playlist_id: playlistId || null,
          category,
          uploaded_by: (authUser.profile && authUser.profile.username) || authUser.user.email
        });
        videoSaved = true;
        if (audios.length) {
          await Data.createAudios(audios.map((a, i) => ({ video_id: videoId, owner_id: authUser.user.id, name: a.name, audio_key: audioKeys[i] })));
          audioKeys.length = 0; // saved: do not discard them below
        }
        setText('uploadStatus', 'Video uploaded successfully!');
        form.reset();
        tempThumb = '';
        tempVideo = null;
        hide('videoThumbPreview');
        $('audioRows').innerHTML = '';
        setTimeout(() => { location.href = 'home.html'; }, 600);
      } catch (err) {
        console.error(err);
        if (!videoSaved) {
          if (thumbKey) Data.discardFile(thumbKey);
          if (videoKey) Data.discardFile(videoKey);
        }
        audioKeys.forEach(k => Data.discardFile(k));
        setText('uploadStatus', (videoSaved ? 'Video saved, but the audio could not be saved: ' : 'Upload failed: ') + ((err && err.message) || 'please try again.'));
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
