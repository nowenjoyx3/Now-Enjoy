/* NOW ENJOY - shared script.
   Loaded on every page AFTER supabase-client.js and BEFORE the page script. */
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

  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  function startParticles() {
    const canvas = document.getElementById('particles-canvas');
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

  // Under-18 visitor: go back to the external page they came from, else a blank page.
  function leaveSite() {
    let external = '';
    try {
      const ref = document.referrer;
      if (ref && new URL(ref).origin !== location.origin) external = ref;
    } catch (_) {}
    location.replace(external || 'about:blank');
  }

  // Age check: shown on EVERY visit to the home page (body has data-age-gate).
  function ageGate() {
    const wrap = document.createElement('div');
    wrap.id = 'ageVerification';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-labelledby', 'ageTitle');
    wrap.innerHTML = `
      <div class="age-box">
        <i class="fa-solid fa-shield-halved age-icon"></i>
        <h2 id="ageTitle" class="age-title">AGE VERIFICATION</h2>
        <p class="age-message">
          Are you 18 years of age or older?<br><br>
          This website is intended exclusively for adults aged 18 and above.
          Please confirm your age before continuing.
        </p>
        <div class="age-buttons">
          <button id="ageYes" class="age-btn age-yes" type="button">
            <i class="fa-solid fa-check mr-2"></i> YES, I AM 18+
          </button>
          <button id="ageNo" class="age-btn age-no" type="button">
            <i class="fa-solid fa-arrow-right-from-bracket mr-2"></i> NO, I AM UNDER 18
          </button>
        </div>
        <p class="age-note">By continuing, you confirm that you meet the minimum age requirement.</p>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add('age-locked');

    wrap.querySelector('#ageYes').addEventListener('click', () => {
      wrap.remove();
      document.body.classList.remove('age-locked');
    });

    wrap.querySelector('#ageNo').addEventListener('click', () => {
      wrap.querySelector('.age-box').innerHTML = `
        <i class="fa-solid fa-circle-exclamation age-icon"></i>
        <h2 class="age-title">ACCESS DENIED</h2>
        <p class="age-message">
          Sorry, you must be at least 18 years old to access this website.
          You will now leave this page.
        </p>`;
      setTimeout(leaveSite, 1800);
    });
  }

  // Visitors without an account: the Profile button opens the login / create-account page.
  function markGuestHeader() {
    document.querySelectorAll('a.nav-btn[href="profile.html"]').forEach(a => a.setAttribute('href', 'index.html'));
  }

  window.NowEnjoyUI = { esc, startParticles, markGuestHeader };

  ready(() => { if (document.body.hasAttribute('data-age-gate')) ageGate(); });
})();
