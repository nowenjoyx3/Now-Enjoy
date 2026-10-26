/* NOW ENJOY - profile page script */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn)
    : fn();

  const { startParticles } = window.NowEnjoyUI;

  const setText = (id, value) => { if ($(id)) $(id).textContent = value; };
  const auth = window.NowEnjoyAuth;

  let currentUser = null;
  let currentProfile = null;

  function renderProfile() {
    const p = currentProfile || {};
    setText('profFullName', p.full_name || '---');
    setText('profUsername', p.username ? '@' + p.username : '---');
    setText('profGmail', (currentUser && currentUser.email) || '---');
    setText('profAge', p.age ? p.age + ' years old' : '---');
  }

  async function loadProfile(user) {
    let profile = await auth.getProfile(user.id);
    if (!profile) {
      // Safety net: create the row from signup data if the database trigger did not.
      const m = user.user_metadata || {};
      const age = Number(m.age);
      if (m.full_name && m.username && Number.isInteger(age) && age >= 18) {
        const { error } = await auth.client.from('profiles').insert({
          id: user.id,
          full_name: String(m.full_name),
          username: String(m.username),
          age
        });
        if (error) console.error('Profile create error:', error);
        else profile = await auth.getProfile(user.id);
      }
    }
    return profile;
  }

  function setupProfileEditing() {
    const modal = $('editProfileModal');
    const form = $('editProfileForm');
    const message = $('profileEditMessage');
    const fields = {
      fullName: $('editFullName'), username: $('editUsername'),
      gmail: $('editGmail'), age: $('editAge')
    };

    function say(text, cls) {
      message.textContent = text;
      message.className = cls;
    }

    function openEditor() {
      const p = currentProfile || {};
      fields.fullName.value = p.full_name || '';
      fields.username.value = p.username || '';
      fields.gmail.value = (currentUser && currentUser.email) || '';
      fields.age.value = p.age || '';
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

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const fullName = fields.fullName.value.trim();
      const username = fields.username.value.trim();
      const age = Number(fields.age.value);

      if (!fullName || !username || !fields.age.value) return say('Please enter valid details in every field.', 'text-red-400');
      if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) return say('Username must be 3–24 letters, numbers, or underscores.', 'text-red-400');
      if (!Number.isInteger(age) || age < 18 || age > 120) return say('Age must be a whole number between 18 and 120.', 'text-red-400');

      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      say('Saving...', 'text-gray-400');
      try {
        const { data, error } = await auth.client
          .from('profiles')
          .update({ full_name: fullName, username, age })
          .eq('id', currentUser.id)
          .select('id, full_name, username, age');

        if (error) {
          if (error.code === '23505') say('That username is already taken.', 'text-red-400');
          else if (error.code === '23514') say('Age must be between 18 and 120.', 'text-red-400');
          else { console.error(error); say('Could not save. Please try again.', 'text-red-400'); }
          return;
        }
        if (!data || !data.length) {
          say('Profile not found. Please logout and login again.', 'text-red-400');
          return;
        }
        currentProfile = data[0];
        renderProfile();
        closeEditor();
      } catch (err) {
        console.error(err);
        say('Could not save. Please try again.', 'text-red-400');
      } finally {
        submit.disabled = false;
      }
    });
  }

  async function init() {
    const user = await auth.requireUser();
    if (!user) return;
    currentUser = user;
    startParticles();

    $('btnLogout').onclick = async () => {
      await auth.signOut();
      location.href = 'index.html';
    };
    setupProfileEditing();

    currentProfile = await loadProfile(user);
    renderProfile();

    // Admin tools are shown ONLY if the database says this account is an admin.
    if (await auth.isAdmin(user.id)) {
      $('adminManagement').style.display = 'block';
    }
  }

  ready(() => init().catch(err => {
    console.error(err);
    alert('Could not load your profile. Please refresh the page.');
  }));

})();
