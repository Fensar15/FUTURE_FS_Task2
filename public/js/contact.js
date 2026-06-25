const form = document.getElementById('contactForm');
const alertBox = document.getElementById('alertBox');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.innerHTML = '';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    message: document.getElementById('message').value.trim(),
    source: 'Website Contact Form',
  };

  try {
    const res = await fetch('/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      alertBox.innerHTML = `<div class="alert alert-error">${data.error || 'Something went wrong.'}</div>`;
      return;
    }

    alertBox.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
    form.reset();
  } catch (err) {
    alertBox.innerHTML = `<div class="alert alert-error">Could not reach the server. Is it running?</div>`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send message';
  }
});
