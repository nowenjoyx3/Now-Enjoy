/* NOW ENJOY - edit-video page script (admin only)
   edit-video.html            -> list of videos
   edit-video.html?id=<id>    -> edit that video */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const { startParticles, esc } = window.NowEnjoyUI;
  const Data = window.NowEnjoyData;

  const MAX_AUDIOS = 8;
  const MAX_DIFF = 0.5;                    // seconds: audio and video length must match within this
  const MAX_VIDEO = 1024 * 1024 * 1024;    // 1 GB
  const MAX_IMAGE = 12 * 1024 * 1024;      // 12 MB
  const AUDIO_RE = /\.(mp3|m4a|ogg|wav)$/i;
  const AUDIO_ACCEPT = '.mp3,.m4a,.ogg,.wav,audio/*';

  const setStatus = (msg, ok) => {
    const el = $('editStatus');
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('ok', !!ok);
  };

  // Length (seconds) of a File or of a URL, read in the browser.
  function mediaDuration(source, tag, label) {
    return new Promise((resolve, reject) => {
      const isFile = typeof source !== 'string';
      const url = isFile ? URL.createObjectURL(source) : source;
      const el = document.createElement(tag);
      const done = (fn, v) => { clearTimeout(timer); if (isFile) URL.revokeObjectURL(url); fn(v); };
      const timer = setTimeout(() => done(reject, new Error('Could not read the length of "' + label + '".')), 20000);
      el.preload = 'metadata';
      el.onloadedmetadata = () => (isFinite(el.duration) && el.duration > 0)
        ? done(resolve, el.duration)
        : done(reject, new Error('Could not read the length of "' + label + '".'));
      el.onerror = () => done(reject, new Error('Could not read "' + label + '".'));
      el.src = url;
    });
  }

  function previewImage(inputId, boxId) {
    const input = $(inputId);
    input.onchange = e => {
      const file = e.target.files && e.target.files[0];
      const box = $(boxId);
      if (!file) { box.classList.add('hidden'); return; }
      if (file.size > MAX_IMAGE) {
        alert('Please choose an image smaller than 12 MB.');
        input.value = '';
        box.classList.add('hidden');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        box.querySelector('img').src = ev.target.result;
        box.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    };
  }

  /* ------------------------------------------------------------------ list */

  async function showList() {
    const items = await Data.listVideos();
    const row = v => `<div class="edit-row">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${esc(v.thumbnail)}" alt="">
        <span class="item-name">${esc(v.title)}<span class="item-sub">${esc(v.category || '')}</span></span>
      </div>
      <button type="button" class="go" data-edit-id="${esc(v.id)}"><i class="fa-solid fa-pen-to-square mr-1"></i> EDIT</button>
    </div>`;

    const render = () => {
      const q = $('listSearch').value.trim().toLowerCase();
      const shown = items.filter(v => !q || String(v.title || '').toLowerCase().includes(q));
      $('editVideosList').innerHTML = shown.map(row).join('');
      $('emptyList').textContent = items.length ? 'No video matches your search.' : 'Nothing to edit yet.';
      $('emptyList').classList.toggle('hidden', shown.length > 0);
    };

    $('listSearch').oninput = render;
    $('editVideosList').onclick = e => {
      const b = e.target.closest('[data-edit-id]');
      if (b) location.href = 'edit-video.html?id=' + encodeURIComponent(b.dataset.editId);
    };
    render();
  }

  /* ---------------------------------------------------------------- editor */

  let state = null; // { video, audios }

  function setAudioInputsDisabled(row, off) {
    row.querySelectorAll('input').forEach(i => { i.disabled = off; });
  }

  function addExistingRow(a) {
    const row = document.createElement('div');
    row.className = 'audio-existing';
    row.dataset.id = a.id;
    row.innerHTML =
      `<input type="text" maxlength="30" class="gothic-input px-3 py-2 rounded-xl w-full sm:w-44 ex-name" value="${esc(a.name)}" aria-label="Audio name">` +
      `<label class="flex-1 min-w-0 text-[10px] text-gray-400">Replace the file (optional)` +
      `<input type="file" accept="${AUDIO_ACCEPT}" class="gothic-input p-2 rounded-xl w-full mt-1 ex-file"></label>` +
      `<button type="button" class="mini-btn ex-remove">REMOVE</button>`;
    const btn = row.querySelector('.ex-remove');
    btn.onclick = () => {
      const gone = row.classList.toggle('removed');
      btn.textContent = gone ? 'UNDO' : 'REMOVE';
      setAudioInputsDisabled(row, gone);
    };
    $('audioExisting').appendChild(row);
  }

  function liveAudioCount() {
    return document.querySelectorAll('#audioExisting .audio-existing:not(.removed)').length +
           document.querySelectorAll('#audioNew .audio-new').length;
  }

  function addNewRow() {
    if (liveAudioCount() >= MAX_AUDIOS) { alert('A video can have up to ' + MAX_AUDIOS + ' audios.'); return; }
    const row = document.createElement('div');
    row.className = 'flex flex-col sm:flex-row gap-2 items-stretch audio-new';
    row.innerHTML =
      '<input type="text" maxlength="30" placeholder="Name (e.g. Hindi)" class="gothic-input px-3 py-2 rounded-xl sm:w-44 audio-name">' +
      `<input type="file" accept="${AUDIO_ACCEPT}" class="gothic-input p-2 rounded-xl flex-1 audio-file">` +
      '<button type="button" class="gothic-input px-3 py-2 rounded-xl audio-remove" aria-label="Remove audio">X</button>';
    row.querySelector('.audio-remove').onclick = () => row.remove();
    $('audioNew').appendChild(row);
  }

  // Reads the audio section. Returns { remove, update, add } or throws a message for the page.
  function collectAudioPlan() {
    const plan = { remove: [], update: [], add: [] };
    const names = new Set();
    const checkName = name => {
      const low = name.toLowerCase();
      if (low === 'original') throw new Error('The name "Original" is already used for the video\'s own sound.');
      if (names.has(low)) throw new Error('Two audios have the same name: ' + name);
      names.add(low);
    };

    document.querySelectorAll('#audioExisting .audio-existing').forEach(row => {
      const orig = state.audios.find(a => a.id === row.dataset.id);
      if (!orig) return;
      if (row.classList.contains('removed')) { plan.remove.push(orig); return; }
      const name = row.querySelector('.ex-name').value.trim();
      if (!name) throw new Error('Every audio needs a name.');
      checkName(name);
      const file = row.querySelector('.ex-file').files[0] || null;
      if (file && !AUDIO_RE.test(file.name)) throw new Error('Audio "' + name + '" must be MP3, M4A, OGG or WAV.');
      if (name !== orig.name || file) plan.update.push({ orig, name, file });
    });

    document.querySelectorAll('#audioNew .audio-new').forEach(row => {
      const name = row.querySelector('.audio-name').value.trim();
      const file = row.querySelector('.audio-file').files[0] || null;
      if (!name && !file) return; // empty row is ignored
      if (!name || !file) throw new Error('Every new audio needs both a name and a file.');
      checkName(name);
      if (!AUDIO_RE.test(file.name)) throw new Error('Audio "' + name + '" must be MP3, M4A, OGG or WAV.');
      plan.add.push({ name, file });
    });

    if (names.size > MAX_AUDIOS) throw new Error('A video can have up to ' + MAX_AUDIOS + ' audios.');
    return plan;
  }

  async function showEditor(id, authUser) {
    const [videos, playlists, audios] = await Promise.all([
      Data.listVideos(),
      Data.listPlaylists(),
      Data.listAudios(id).catch(() => [])
    ]);
    const video = videos.find(v => String(v.id) === String(id));
    if (!video) {
      alert('Video not found.');
      location.replace('edit-video.html');
      return;
    }
    state = { video, audios };

    $('viewList').classList.add('hidden');
    $('viewEdit').classList.remove('hidden');

    $('editTitle').value = video.title || '';
    $('editCategory').value = video.category || '';
    $('editPlaylist').innerHTML =
      '<option value="">-- No Playlist (General Library) --</option>' +
      playlists.map(p => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');
    $('editPlaylist').value = video.playlistId || '';
    $('editThumbCurrent').querySelector('img').src = video.thumbnail;
    $('watchLink').href = 'video.html?id=' + encodeURIComponent(video.id);

    previewImage('editThumbInput', 'editThumbPreview');
    audios.forEach(addExistingRow);
    $('noAudioNote').classList.toggle('hidden', audios.length > 0);
    $('btnAddAudio').onclick = addNewRow;

    $('formEditVideo').onsubmit = e => { e.preventDefault(); save(authUser); };
  }

  async function save(authUser) {
    const btn = $('btnSave');
    const video = state.video;
    const title = $('editTitle').value.trim();
    const playlistId = $('editPlaylist').value || null;
    const category = $('editCategory').value;
    const thumbFile = $('editThumbInput').files[0] || null;
    const videoFile = $('editVideoInput').files[0] || null;

    if (!title) { setStatus('Title is required.'); return; }
    if (!category) { setStatus('Please select a category.'); return; }
    if (thumbFile && thumbFile.size > MAX_IMAGE) { setStatus('Please choose a thumbnail smaller than 12 MB.'); return; }
    if (videoFile && videoFile.size > MAX_VIDEO) { setStatus('Please choose a video smaller than 1 GB.'); return; }

    let plan;
    try { plan = collectAudioPlan(); } catch (err) { setStatus(err.message); return; }

    const uploads = [];      // keys uploaded during this save
    const saved = new Set(); // keys that are now used by the database
    let changed = false;     // something was already written to the database

    btn.disabled = true;
    setStatus('');
    try {
      /* 1) audio length must match the (new or current) video */
      const audioFiles = plan.update.filter(u => u.file).map(u => ({ name: u.name, file: u.file }))
        .concat(plan.add.map(a => ({ name: a.name, file: a.file })));
      if (audioFiles.length || videoFile) {
        setStatus('Checking audio length...');
        const vDur = await mediaDuration(videoFile || video.videoUrl, 'video', videoFile ? videoFile.name : 'the current video');
        const which = videoFile ? 'new video' : 'video';
        for (const f of audioFiles) {
          const aDur = await mediaDuration(f.file, 'audio', f.file.name);
          if (Math.abs(aDur - vDur) > MAX_DIFF) {
            throw new Error('Audio "' + f.name + '" is ' + aDur.toFixed(2) + ' s but the ' + which + ' is ' + vDur.toFixed(2) +
              ' s. The difference must be within ' + MAX_DIFF + ' s.');
          }
        }
        if (videoFile) {
          // audios that stay as they are must also fit the new video
          const replaced = new Set(plan.update.filter(u => u.file).map(u => u.orig.id));
          const removed = new Set(plan.remove.map(r => r.id));
          for (const a of state.audios) {
            if (replaced.has(a.id) || removed.has(a.id)) continue;
            let aDur;
            try { aDur = await mediaDuration(a.url, 'audio', a.name); } catch (_) { continue; }
            if (Math.abs(aDur - vDur) > MAX_DIFF) {
              throw new Error('The existing audio "' + a.name + '" is ' + aDur.toFixed(2) + ' s but the new video is ' + vDur.toFixed(2) +
                ' s. Replace or remove that audio too.');
            }
          }
        }
      }

      /* 2) upload new files */
      const up = async (file, folder, label) => {
        setStatus('Uploading ' + label + '... 0%');
        const key = await Data.uploadFile(file, folder, pct => setStatus('Uploading ' + label + '... ' + pct + '%'));
        uploads.push(key);
        return key;
      };
      const newThumb = thumbFile ? await up(thumbFile, 'thumbs', 'thumbnail') : null;
      const newVideo = videoFile ? await up(videoFile, 'videos', 'video') : null;
      for (const u of plan.update) if (u.file) u.newKey = await up(u.file, 'audios', 'audio "' + u.name + '"');
      for (const a of plan.add) a.newKey = await up(a.file, 'audios', 'audio "' + a.name + '"');

      /* 3) video details */
      const fields = {};
      if (title !== video.title) fields.title = title;
      if (playlistId !== (video.playlistId || null)) fields.playlist_id = playlistId;
      if (category !== video.category) fields.category = category;
      if (newThumb) fields.thumb_key = newThumb;
      if (newVideo) fields.video_key = newVideo;
      if (Object.keys(fields).length) {
        setStatus('Saving details...');
        await Data.updateVideo(video.id, fields);
        changed = true;
        if (newThumb) { saved.add(newThumb); if (video.thumbKey) Data.discardFile(video.thumbKey); }
        if (newVideo) { saved.add(newVideo); if (video.videoKey) Data.discardFile(video.videoKey); }
      }

      /* 4) audios: remove, rename / replace, add */
      for (const r of plan.remove) {
        setStatus('Removing audio "' + r.name + '"...');
        await Data.remove('video_audios', r.id); // also deletes the file from R2
        changed = true;
      }
      for (const u of plan.update) {
        setStatus('Saving audio "' + u.name + '"...');
        const f = {};
        if (u.name !== u.orig.name) f.name = u.name;
        if (u.newKey) f.audio_key = u.newKey;
        await Data.updateAudio(u.orig.id, f);
        changed = true;
        if (u.newKey) { saved.add(u.newKey); if (u.orig.key) Data.discardFile(u.orig.key); }
      }
      if (plan.add.length) {
        setStatus('Saving new audios...');
        await Data.createAudios(plan.add.map(a => ({
          video_id: video.id, owner_id: authUser.user.id, name: a.name, audio_key: a.newKey
        })));
        changed = true;
        plan.add.forEach(a => saved.add(a.newKey));
      }

      if (!changed && !uploads.length) {
        setStatus('Nothing was changed.');
        btn.disabled = false;
        return;
      }
      setStatus('Saved successfully!', true);
      setTimeout(() => { location.href = 'edit-video.html?id=' + encodeURIComponent(video.id); }, 800);
    } catch (err) {
      console.error(err);
      uploads.filter(k => !saved.has(k)).forEach(k => Data.discardFile(k));
      setStatus((changed ? 'Some changes were saved, but not all: ' : 'Could not save: ') +
        ((err && err.message) || 'please try again.') +
        (changed ? ' Reload the page to see the current state.' : ''));
      btn.disabled = false;
    }
  }

  async function init() {
    const authUser = await NowEnjoyAuth.requireAdmin();
    if (!authUser) return;
    startParticles();
    Data.cleanup(); // quietly removes leftover files from R2
    const id = new URLSearchParams(location.search).get('id');
    if (id) await showEditor(id, authUser);
    else await showList();
  }

  ready(() => init().catch(async err => {
    console.error(err);
    const s = await NowEnjoyAuth.getSession();
    if (!s) location.replace('index.html');
    else alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
