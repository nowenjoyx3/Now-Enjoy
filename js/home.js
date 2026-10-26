/* NOW ENJOY - home page script (guests allowed) */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();
  const { esc, startParticles, markGuestHeader } = window.NowEnjoyUI;
  const Data = window.NowEnjoyData;

  // Selected categories from the Filter menu (empty = show everything).
  const selectedCats = new Set();
  let allVideos = null;   // loaded once, then search/filter work in memory
  let currentTerm = '';

  function cardVideo(v) {
    return `<article class="gothic-frame media-card" tabindex="0" role="link" data-play-video="${esc(v.id)}"><img src="${esc(v.thumbnail)}" alt="${esc(v.title)} thumbnail"><h3>${esc(v.title)}</h3><p>${Number(v.views) || 0} Views</p></article>`;
  }

  function setupCardClicks() {
    document.addEventListener('click', e => {
      const v = e.target.closest('[data-play-video]');
      if (v) location.href = 'video.html?id=' + encodeURIComponent(v.dataset.playVideo);
    });
    document.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-play-video]')) {
        e.preventDefault();
        e.target.click();
      }
    });
  }

  function renderVideos() {
    const list = (allVideos || []).filter(v =>
      (v.title || '').toLowerCase().includes(currentTerm) &&
      (selectedCats.size === 0 || selectedCats.has(v.category))
    );
    $('videoCardsContainer').innerHTML = list.map(cardVideo).join('');
    $('emptyVideos').classList.toggle('hidden', list.length > 0);
  }

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
    const user = await NowEnjoyAuth.optionalUser();
    if (!user) markGuestHeader();
    startParticles();
    allVideos = await Data.listVideos();
    renderVideos();
    $('searchInput').oninput = e => {
      currentTerm = e.target.value.toLowerCase().trim();
      renderVideos();
    };
    setupCategoryFilter(renderVideos);
    setupCardClicks();
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
