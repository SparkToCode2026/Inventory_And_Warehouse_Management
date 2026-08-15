const TOKEN_KEY = 'token';

// Execute as soon as DOM loads
document.addEventListener('DOMContentLoaded', () => {
    updateNavigation();
});

function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

// Decode JWT payload without external libraries
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to parse JWT token:', e);
        return null;
    }
}

function updateNavigation() {
    const token = getStoredToken();
    const loginBtn = document.getElementById('loginNavBtn');
    const registerBtn = document.getElementById('registerNavBtn');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const changePasswordBtn = document.getElementById('changePasswordNavBtn');

    //If no token found in localStorage -> User is logged out
    if (!token) {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (changePasswordBtn) changePasswordBtn.classList.add('hidden');
        return;
    }

    const payload = parseJwt(token);

    //Check if token parsing failed OR token is expired
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
        localStorage.removeItem(TOKEN_KEY);
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (registerBtn) registerBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (changePasswordBtn) changePasswordBtn.classList.add('hidden');
        return;
    }

    const displayName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';

    //Update UI to Logged-In state
    if (loginBtn) loginBtn.classList.add('hidden');
    if (registerBtn) registerBtn.classList.add('hidden');

    if (userInfo) {
        userInfo.textContent = `Welcome, ${displayName}`;
        userInfo.classList.remove('hidden');
    }

    if (logoutBtn) {
        logoutBtn.classList.remove('hidden');
        logoutBtn.onclick = handleLogout;
    }

    if (changePasswordBtn) {
        changePasswordBtn.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.reload();
}
