/* NOW ENJOY - index page script */
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

  const dbPut = (store, item) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    tx.oncomplete = () => resolve(item);
    tx.onerror = () => reject(tx.error);
  });

  const dbGetAll = store => new Promise((resolve, reject) => {
    const r = db.transaction(store, 'readonly').objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

  const alertText = (id, msg) => {
    if ($(id)) { $(id).textContent = msg; $(id).classList.remove('hidden'); }
  };

  const hide = id => { if ($(id)) $(id).classList.add('hidden'); };

  const SESSION_KEY = 'now_enjoy_session_user';
  const session = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  };


  const OWNER_EMAIL = 'DracoAura099@gmail.com';
  const OWNER_PASSWORD = 'DracoAura099@Hacker';
  const makeOwnerUser = () => ({
    fullName: 'Draco Aura', username: 'DracoAura099', gmail: OWNER_EMAIL,
    age: '', role: 'owner', createdAt: new Date().toISOString()
  });

  async function hashPassword(password) {
    const data = new TextEncoder().encode(password + '_NOW_ENJOY_SALT_2026');
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function setupToggle(buttonId, inputId) {
    const b = $(buttonId), i = $(inputId);
    if (b && i) b.onclick = () => {
      const show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      b.innerHTML = show ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    };
  }

  async function init() {
    startParticles();
    await initDB();
    if (session()) { location.replace('home.html'); return; }

    const loginCard = $('loginCard'), regCard = $('registerCard');
    $('btnGotoRegister').onclick = () => { loginCard.classList.add('hidden'); regCard.classList.remove('hidden'); };
    $('btnGotoLogin').onclick = () => { regCard.classList.add('hidden'); loginCard.classList.remove('hidden'); };
    setupToggle('toggleLoginPass', 'loginPassword');
    setupToggle('toggleRegPass', 'regPassword');
    setupToggle('toggleRegRepeatPass', 'regRepeatPassword');

    $('loginForm').onsubmit = async e => {
      e.preventDefault();
      hide('loginAlert');
      const email = $('loginEmail').value.trim(), pass = $('loginPassword').value;
      if (!email || !pass) { alertText('loginAlertText', 'Please enter both Gmail and password.'); return; }
      try {
        let user;
        if (email.toLowerCase() === OWNER_EMAIL.toLowerCase() && pass === OWNER_PASSWORD) {
          user = makeOwnerUser();
        } else {
          const users = await dbGetAll('users'), hash = await hashPassword(pass);
          user = users.find(u => u.gmail.toLowerCase() === email.toLowerCase() && u.passwordHash === hash);
        }
        if (!user) { alertText('loginAlertText', 'Invalid email or password credentials!'); return; }
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        location.href = 'home.html';
      } catch (err) {
        alertText('loginAlertText', 'Unable to log in. Please try again.');
        console.error(err);
      }
    };

    $('registerForm').onsubmit = async e => {
      e.preventDefault();
      hide('regAlert');
      const fullName = $('regFullName').value.trim(),
        username = $('regUsername').value.trim(),
        gmail = $('regGmail').value.trim(),
        password = $('regPassword').value,
        repeat = $('regRepeatPassword').value,
        age = Number($('regAge').value);
      if (!fullName || !username || !gmail || !password || !repeat || !$('regAge').value)
        return alertText('regAlertText', 'All fields are required!');
      if (!/^[^\s@]+@gmail\.com$/i.test(gmail))
        return alertText('regAlertText', 'Please enter a valid Gmail address ending in @gmail.com.');
      if (password.length < 6)
        return alertText('regAlertText', 'Password must be at least 6 characters.');
      if (password !== repeat)
        return alertText('regAlertText', 'Passwords do not match!');
      if (!Number.isInteger(age) || age < 13 || age > 120)
        return alertText('regAlertText', 'Age must be between 13 and 120.');
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username))
        return alertText('regAlertText', 'Username must be 3–24 letters, numbers, or underscores.');
      try {
        const users = await dbGetAll('users');
        if (users.some(u => u.username.toLowerCase() === username.toLowerCase()))
          return alertText('regAlertText', 'Username is already taken!');
        if (users.some(u => u.gmail.toLowerCase() === gmail.toLowerCase()))
          return alertText('regAlertText', 'This Gmail is already registered.');
        const user = {
          fullName, username, gmail,
          passwordHash: await hashPassword(password),
          age, createdAt: new Date().toISOString()
        };
        await dbPut('users', user);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        location.href = 'home.html';
      } catch (err) {
        alertText('regAlertText', 'Unable to create account. Please try again.');
        console.error(err);
      }
    };
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not initialize browser storage. Please use a modern browser with IndexedDB enabled.');
  }));

})();
