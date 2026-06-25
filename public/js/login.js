const form = document.getElementById('loginForm');
const alertBox = document.getElementById('alertBox');
const loginBtn = document.getElementById('loginBtn');

// Already logged in? Skip straight to the dashboard.
if (localStorage.getItem('crm_token')) {
  window.location.href = 'index.html';
}

function showError(message) {
  alertBox.innerHTML = `<div class="alert alert-error">${message}</div>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in…';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Could not sign in.');
      return;
    }

    localStorage.setItem('crm_token', data.token);
    localStorage.setItem('crm_username', data.username);
    window.location.href = 'index.html';
  } catch (err) {
    showError('Could not reach the server. Is it running?');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign in';
  }
});
