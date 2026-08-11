const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');
    const statusBanner = document.getElementById('statusBanner');
    const submitBtn = document.getElementById('loginSubmitBtn');

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
        submitBtn.textContent = isLoading ? 'Signing in...' : 'Sign In';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearStatus();

        const payload = {
            Email: document.getElementById('loginEmail').value,
            Password: document.getElementById('loginPassword').value
        };

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/Auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            
            const contentType = res.headers.get('content-type') || '';
            const body = contentType.includes('application/json')
                ? await res.json()
                : await res.text();

            if (!res.ok) {
                throw new Error(typeof body === 'string' ? body : 'Login failed.');
            }

            localStorage.setItem(TOKEN_KEY, body.token);

            showStatus('Login successful. Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 900);

        } catch (err) {
            showStatus(err.message, 'error');
            setLoading(false);
        }
    });
});