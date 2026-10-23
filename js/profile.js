/* NOW ENJOY - profile page script */
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

  const SESSION_KEY = 'now_enjoy_session_user';
  const session = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  };

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };

  const requireUser = () => {
    if (!session()) { location.replace('index.html'); return false; }
    return true;
  };


  const ADMIN_USERNAME = 'DracoAura099@Hacker';
  const ADMIN_PASSWORD = 'HabibAura099@Hacker';
  const PROFILE_KEY = 'nowEnjoyProfileOverrides';

  function setupAdminLogin() {
    const secretLine = $('adminSecretLine');
    const loginModal = $('adminLoginModal');
    const loginForm = $('adminLoginForm');
    const usernameInput = $('adminUsername');
    const passwordInput = $('adminPassword');
    const message = $('adminLoginMessage');
    const submitButton = $('adminLoginSubmit');
    const adminManagement = $('adminManagement');

    let clickCount = 0, clickResetTimer = null;
    let wrongAttempts = 0, lockoutCount = 0, lockoutUntil = 0, countdownInterval = null;

    function lockSubmit(locked) {
      submitButton.disabled = locked;
      submitButton.style.opacity = locked ? '0.5' : '1';
      submitButton.style.cursor = locked ? 'not-allowed' : 'pointer';
    }

    function openLogin() {
      if (Date.now() < lockoutUntil) {
        loginModal.classList.add('open');
        updateLockoutMessage();
        return;
      }
      message.textContent = '';
      message.className = 'text-gray-400';
      loginModal.classList.add('open');
      usernameInput.focus();
    }

    function closeLogin() {
      loginModal.classList.remove('open');
      loginForm.reset();
      message.textContent = '';
    }

    function updateLockoutMessage() {
      const remaining = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      if (remaining > 0) {
        message.textContent = `Too many incorrect attempts. Try again in ${remaining} seconds.`;
        message.className = 'text-red-400';
        lockSubmit(true);
      } else {
        clearInterval(countdownInterval);
        countdownInterval = null;
        lockoutUntil = 0;
        message.textContent = 'You can try logging in again.';
        message.className = 'text-gray-400';
        lockSubmit(false);
      }
    }

    function startLockout() {
      lockoutCount++;
      const durationSeconds = lockoutCount * 30;
      lockoutUntil = Date.now() + durationSeconds * 1000;
      message.textContent = `Too many incorrect attempts. Locked for ${durationSeconds} seconds.`;
      message.className = 'text-red-400';
      lockSubmit(true);
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(updateLockoutMessage, 250);
    }

    // Three quick clicks on the red line open the admin login.
    secretLine.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickResetTimer);
      if (clickCount >= 3) { clickCount = 0; openLogin(); return; }
      clickResetTimer = setTimeout(() => { clickCount = 0; }, 1800);
    });

    loginForm.addEventListener('submit', event => {
      event.preventDefault();
      if (Date.now() < lockoutUntil) { updateLockoutMessage(); return; }

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminManagement.style.display = 'block';
        closeLogin();
        adminManagement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        wrongAttempts = 0; lockoutCount = 0; lockoutUntil = 0;
        return;
      }

      wrongAttempts++;
      passwordInput.value = '';
      if (wrongAttempts >= 3) {
        wrongAttempts = 0;
        startLockout();
      } else {
        message.textContent = `Incorrect username or password. ${3 - wrongAttempts} attempt(s) left before lockout.`;
        message.className = 'text-red-400';
      }
    });

    $('adminLoginClose').addEventListener('click', closeLogin);
    loginModal.addEventListener('click', e => { if (e.target === loginModal) closeLogin(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && loginModal.classList.contains('open')) closeLogin();
    });
  }

  function setupProfileEditing() {
    const modal = $('editProfileModal');
    const form = $('editProfileForm');
    const message = $('profileEditMessage');
    const fields = {
      fullName: $('editFullName'), username: $('editUsername'),
      gmail: $('editGmail'), age: $('editAge')
    };
    const display = {
      fullName: $('profFullName'), username: $('profUsername'),
      gmail: $('profGmail'), age: $('profAge')
    };

    function readCurrentProfile() {
      let saved = {};
      try { saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch (_) {}
      return {
        fullName: saved.fullName ?? display.fullName.textContent.trim(),
        username: saved.username ?? display.username.textContent.trim(),
        gmail: saved.gmail ?? display.gmail.textContent.trim(),
        age: saved.age ?? display.age.textContent.trim()
      };
    }

    function applyProfile(profile) {
      display.fullName.textContent = profile.fullName || '---';
      display.username.textContent = profile.username || '---';
      display.gmail.textContent = profile.gmail || '---';
      display.age.textContent = profile.age || '---';
    }

    function openEditor() {
      const profile = readCurrentProfile();
      Object.keys(fields).forEach(k => {
        fields[k].value = profile[k] === '---' ? '' : profile[k];
      });
      message.textContent = '';
      modal.classList.add('open');
      fields.fullName.focus();
    }

    const closeEditor = () => modal.classList.remove('open');

    $('btnEditProfile').addEventListener('click', openEditor);
    $('cancelEditProfile').addEventListener('click', closeEditor);
    modal.addEventListener('click', e => { if (e.target === modal) closeEditor(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeEditor();
    });

    form.addEventListener('submit', event => {
      event.preventDefault();
      const profile = {
        fullName: fields.fullName.value.trim(),
        username: fields.username.value.trim(),
        gmail: fields.gmail.value.trim(),
        age: fields.age.value.trim()
      };
      if (!profile.fullName || !profile.username || !profile.gmail || !profile.age ||
          Number(profile.age) < 1 || Number(profile.age) > 120) {
        message.textContent = 'Please enter valid details in every field.';
        message.className = 'text-red-400';
        return;
      }
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
        applyProfile(profile);
        message.textContent = 'Profile details saved on this browser.';
        message.className = 'text-green-400';
        closeEditor();
      } catch (_) {
        message.textContent = 'Could not save. Please check browser storage settings.';
        message.className = 'text-red-400';
      }
    });

    // Re-apply details saved earlier on this browser.
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (saved && typeof saved === 'object') applyProfile(saved);
    } catch (_) {}
  }

  function init() {
    if (!requireUser()) return;
    startParticles();
    const u = session();
    setText('profFullName', u.fullName);
    setText('profUsername', '@' + u.username);
    setText('profGmail', u.gmail);
    setText('profAge', u.age + ' years old');
    $('btnLogout').onclick = () => {
      localStorage.removeItem(SESSION_KEY);
      location.href = 'index.html';
    };
    setupAdminLogin();
    setupProfileEditing();
  }

  ready(init);

})();
