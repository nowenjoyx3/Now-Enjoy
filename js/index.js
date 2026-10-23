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

  const auth = window.NowEnjoyAuth || {
    ready: false,
    getSession: async () => null,
    purgeLegacyUsers() {}
  };

  function showAlert(boxId, textId, msg, kind) {
    const box = $(boxId), text = $(textId);
    if (!box || !text) return;
    text.textContent = msg;
    box.classList.remove('hidden');
    if (kind === 'success') {
      box.style.background = '#052e1699';
      box.style.borderColor = '#22c55e';
      box.style.color = '#bbf7d0';
    } else {
      box.style.background = '';
      box.style.borderColor = '';
      box.style.color = '';
    }
  }

  const hideAlert = id => { if ($(id)) $(id).classList.add('hidden'); };

  function setBusy(form, busy) {
    const b = form.querySelector('button[type="submit"]');
    if (!b) return;
    b.disabled = busy;
    b.style.opacity = busy ? '0.6' : '';
    b.style.cursor = busy ? 'not-allowed' : '';
  }

  function setupToggle(buttonId, inputId) {
    const b = $(buttonId), i = $(inputId);
    if (b && i) b.onclick = () => {
      const show = i.type === 'password';
      i.type = show ? 'text' : 'password';
      b.innerHTML = show ? '<i class="fa-solid fa-eye"></i>' : '<i class="fa-solid fa-eye-slash"></i>';
    };
  }

  const msgOf = err => String((err && err.message) || '').toLowerCase();

  function loginErrorText(err) {
    const m = msgOf(err);
    if (m.includes('invalid login credentials')) return 'Invalid email or password credentials!';
    if (m.includes('email not confirmed')) return 'Please confirm your Gmail first. Check your inbox (and spam folder) for the confirmation link.';
    if (err && (err.status === 429 || m.includes('rate limit'))) return 'Too many attempts. Please wait a few minutes and try again.';
    return 'Unable to log in. Please try again.';
  }

  function signupErrorText(err) {
    const m = msgOf(err);
    const code = String((err && err.code) || '');
    if (code === 'user_already_exists' || m.includes('already registered')) return 'This Gmail is already registered. Please login.';
    if (code === 'weak_password' || m.includes('password should') || m.includes('weak password')) return 'Password is too weak. Please choose a stronger password.';
    if (err && (err.status === 429 || m.includes('rate limit'))) return 'Too many sign-up attempts or emails sent. Please wait a while and try again.';
    if (m.includes('database error saving new user')) return 'Could not create the account. Please make sure your username is unique and that you are 18 or older.';
    if (m.includes('invalid') && m.includes('email')) return 'Please enter a valid Gmail address.';
    return 'Unable to create account. Please try again.';
  }

  async function init() {
    startParticles();
    auth.purgeLegacyUsers();

    const loginCard = $('loginCard'), regCard = $('registerCard');
    $('btnGotoRegister').onclick = () => { loginCard.classList.add('hidden'); regCard.classList.remove('hidden'); };
    $('btnGotoLogin').onclick = () => { regCard.classList.add('hidden'); loginCard.classList.remove('hidden'); };
    setupToggle('toggleLoginPass', 'loginPassword');
    setupToggle('toggleRegPass', 'regPassword');
    setupToggle('toggleRegRepeatPass', 'regRepeatPassword');

    $('loginForm').onsubmit = async e => {
      e.preventDefault();
      hideAlert('loginAlert');
      if (!auth.ready) {
        showAlert('loginAlert', 'loginAlertText', 'Login service is not available. Please refresh the page.');
        return;
      }
      const form = e.target;
      const email = $('loginEmail').value.trim().toLowerCase();
      const pass = $('loginPassword').value;
      if (!email || !pass) {
        showAlert('loginAlert', 'loginAlertText', 'Please enter both Gmail and password.');
        return;
      }
      setBusy(form, true);
      try {
        const { error } = await auth.client.auth.signInWithPassword({ email, password: pass });
        if (error) {
          showAlert('loginAlert', 'loginAlertText', loginErrorText(error));
          return;
        }
        location.href = 'home.html';
      } catch (err) {
        console.error(err);
        showAlert('loginAlert', 'loginAlertText', 'Unable to log in. Please try again.');
      } finally {
        setBusy(form, false);
      }
    };

    $('registerForm').onsubmit = async e => {
      e.preventDefault();
      hideAlert('regAlert');
      const say = (msg, kind) => showAlert('regAlert', 'regAlertText', msg, kind);
      if (!auth.ready) { say('Sign-up service is not available. Please refresh the page.'); return; }

      const form = e.target;
      const fullName = $('regFullName').value.trim();
      const username = $('regUsername').value.trim();
      const gmail = $('regGmail').value.trim().toLowerCase();
      const password = $('regPassword').value;
      const repeat = $('regRepeatPassword').value;
      const ageRaw = $('regAge').value;
      const age = Number(ageRaw);

      if (!fullName || !username || !gmail || !password || !repeat || !ageRaw) return say('All fields are required!');
      if (fullName.length > 100) return say('Name is too long (maximum 100 characters).');
      if (!/^[^\s@]+@gmail\.com$/i.test(gmail)) return say('Please enter a valid Gmail address ending in @gmail.com.');
      if (password.length < 6) return say('Password must be at least 6 characters.');
      if (password !== repeat) return say('Passwords do not match!');
      if (!Number.isInteger(age) || age > 120) return say('Please enter a valid age.');
      if (age < 18) return say('Sorry, you must be at least 18 years old to create an account.');
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return say('Username must be 3–24 letters, numbers, or underscores.');

      setBusy(form, true);
      try {
        // 1) Friendly username check (the database also enforces uniqueness).
        const check = await auth.client.rpc('is_username_available', { p_username: username });
        if (check.error) {
          console.error(check.error);
          say('Sign-up is not fully set up yet (database setup missing). Please contact the site owner.');
          return;
        }
        if (check.data === false) return say('Username is already taken!');

        // 2) Create the account with Supabase Auth.
        //    full_name / username / age travel as metadata; a database trigger saves them into public.profiles.
        const { data, error } = await auth.client.auth.signUp({
          email: gmail,
          password,
          options: {
            data: { full_name: fullName, username, age },
            emailRedirectTo: new URL('./', location.href).href
          }
        });
        if (error) { say(signupErrorText(error)); return; }

        // Supabase hides "already registered" emails by returning a user with no identities.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          say('This Gmail is already registered. Please login.');
          return;
        }

        // Email confirmation OFF -> we already have a session.
        if (data.session) { location.href = 'home.html'; return; }

        // Email confirmation ON -> account is NOT active until the link is clicked.
        form.reset();
        say('Almost done! We sent a confirmation link to ' + gmail + '. Your account becomes active only after you confirm your email. Check your inbox (and spam folder), click the link, then login.', 'success');
      } catch (err) {
        console.error(err);
        say('Unable to create account. Please try again.');
      } finally {
        setBusy(form, false);
      }
    };

    if (!auth.ready) {
      showAlert('loginAlert', 'loginAlertText', 'Login service could not be loaded. Please check your internet connection and refresh the page.');
      return;
    }

    // Already logged in (or just came back from the email-confirmation link)? Go to home.
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''));
    const hashError = hashParams.get('error_description');
    const session = await auth.getSession();
    if (session) { location.replace('home.html'); return; }
    if (hashError) showAlert('loginAlert', 'loginAlertText', hashError);
  }

  ready(() => init().catch(err => {
    console.error(err);
    showAlert('loginAlert', 'loginAlertText', 'Something went wrong while loading the page. Please refresh and try again.');
  }));

})();
