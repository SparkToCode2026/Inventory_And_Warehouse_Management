
const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';
 
document.addEventListener('DOMContentLoaded', () => {
 
  const form = document.getElementById('registerForm');
  const statusBanner = document.getElementById('statusBanner');
  const submitBtn = document.getElementById('registerSubmitBtn');
 
  function showStatus(message, type = 'info') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
    statusBanner.hidden = false;
  }
 
  function clearStatus() {
    statusBanner.hidden = true;
  }
 
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Creating account…' : 'Create Account';
  }
 
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();
 
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
 
    // Client-side only — the backend never sees confirmPassword,
    // this just catches typos before making a network call.
    if (password !== confirmPassword) {
      showStatus("Passwords don't match.", 'error');
      return;
    }
 
    const payload = {
      Name: document.getElementById('regName').value,
      Email: document.getElementById('regEmail').value,
      Password: password,
      Role: document.getElementById('regRole').value,
      Phone: document.getElementById('regPhone').value || null
    };
 
    setLoading(true);
 
    try {
      const res = await fetch(`${API_BASE}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
 
      // Register returns JSON on success ({ token }) but a plain-text
      // string on failure (e.g. "Email already registered.") — check
      // content-type before deciding how to parse the body.
      const contentType = res.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await res.json()
        : await res.text();
 
      if (!res.ok) {
        throw new Error(typeof body === 'string' ? body : 'Registration failed.');
      }
 
      localStorage.setItem(TOKEN_KEY, body.token);
 
      showStatus('Account created. Redirecting…', 'success');
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 900);
 
    } catch (err) {
      showStatus(err.message, 'error');
      setLoading(false);
    }
  });
 
});
 