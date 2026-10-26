/* NOW ENJOY - delete-video page script */
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

  const dbDelete = (store, id) => Data.remove(store === 'videos' ? 'videos' : 'playlists', id);

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };

  const hide = id => { if ($(id)) $(id).classList.add('hidden'); };


  const TYPE = 'video';
  const STORE = 'videos';
  let deleteTarget = null;

  function deleteRow(item) {
    return `<div class="delete-row"><div class="flex items-center gap-3 min-w-0"><img src="${item.thumbnail || ''}" alt=""><span class="item-name">${esc(item.title)}</span></div><button type="button" data-delete-id="${esc(item.id)}" aria-label="Delete ${esc(item.title)}"><i class="fa-solid fa-trash-can"></i></button></div>`;
  }

  async function loadDeleteList() {
    const items = await dbGetAll(STORE);
    $('deleteVideosList').innerHTML = items.map(deleteRow).join('');
    $('emptyDelete').classList.toggle('hidden', items.length > 0);
  }

  async function init() {
    const authUser = await requireUser();
    if (!authUser) return;
    startParticles();
    await initDB();
    Data.cleanup(); // quietly removes leftover files from R2
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
