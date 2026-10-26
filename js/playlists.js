/* NOW ENJOY - playlists page script */
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

  // Login is handled by Supabase Auth (see js/supabase-client.js).

  function cardPlaylist(p, count, cats = []) {
    return `<article class="gothic-frame media-card" tabindex="0" role="link" data-open-playlist="${esc(p.id)}" data-categories="${esc(cats.join(','))}"><img src="${p.cover}" alt="${esc(p.title)} cover"><h3>${esc(p.title)}</h3><p>${count} Videos</p></article>`;
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


  let playlistsLoaded = false;

  async function loadPlaylists() {
    const box = $('playlistCardsContainer');
    const [pls, vids] = await Promise.all([dbGetAll('playlists'), dbGetAll('videos')]);
    box.innerHTML = pls.map(p => {
      const mine = vids.filter(v => v.playlistId === p.id);
      const cats = [...new Set(mine.map(v => v.category).filter(Boolean))];
      return cardPlaylist(p, mine.length, cats);
    }).join('');
    playlistsLoaded = true;
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
        // A playlist matches a category if at least one of its videos has that category.
        const cats = (card.dataset.categories || '').split(',');
        const catOk = selectedCats.size === 0 || cats.some(c => selectedCats.has(c));
        const matches = catOk && (!query || normalize((card.querySelector('h3') || card).textContent).includes(query));
        card.hidden = !matches;
        if (matches) visibleCount++;
      });

      const filtering = Boolean(query) || selectedCats.size > 0;
      noResultsMessage.classList.toggle('hidden', !filtering || visibleCount > 0);
      emptyMessage.classList.toggle('hidden', !playlistsLoaded || cards.length > 0 || filtering);
    }

    input.addEventListener('input', filterPlaylists);
    new MutationObserver(filterPlaylists).observe(container, {
      childList: true, subtree: true, characterData: true
    });
    filterPlaylists();
    return filterPlaylists;
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
    const authUser = await NowEnjoyAuth.optionalUser();
    if (!authUser) NowEnjoyUI.markGuestHeader();
    startParticles();
    const refilter = setupPlaylistSearch();
    setupCategoryFilter(refilter);
    await initDB();
    await loadPlaylists();
    setupCardClicks();
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
