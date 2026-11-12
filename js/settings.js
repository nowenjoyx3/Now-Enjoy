/* NOW ENJOY - settings page script (logged-in users only)
   Day / Night and Language. Saved only in this browser tab (see js/common.js), never in the database. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const { startParticles } = window.NowEnjoyUI;
  const S = window.NowEnjoySettings;

  // Short names shown in the language list.
  const LABEL = { en: 'EN', hi: 'HIN', as: 'ASM' };

  function render() {
    const day = S.theme === 'day';
    $('btnDay').classList.toggle('active', day);
    $('btnNight').classList.toggle('active', !day);
    $('btnDay').setAttribute('aria-pressed', String(day));
    $('btnNight').setAttribute('aria-pressed', String(!day));

    $('langLabel').textContent = LABEL[S.lang] || 'EN';
    document.querySelectorAll('#langMenu [data-lang]').forEach(b => {
      const on = b.dataset.lang === S.lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
  }

  function setupLanguageMenu() {
    const btn = $('langBtn'), menu = $('langMenu');
    const setOpen = open => {
      menu.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
    };

    btn.addEventListener('click', e => { e.stopPropagation(); setOpen(menu.classList.contains('hidden')); });
    menu.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('[data-lang]');
      if (!b) return;
      S.setLang(b.dataset.lang);
      render();
      setOpen(false);
    });
    document.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }

  async function init() {
    const user = await NowEnjoyAuth.requireUser(); // guests are sent to the login page
    if (!user) return;
    startParticles();

    $('btnDay').onclick = () => { S.setTheme('day'); render(); };
    $('btnNight').onclick = () => { S.setTheme('night'); render(); };
    setupLanguageMenu();
    render();
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your data. Please refresh the page and try again.');
  }));

})();
