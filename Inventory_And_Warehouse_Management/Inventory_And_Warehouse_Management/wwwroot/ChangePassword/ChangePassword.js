const API_BASE = "https://localhost:7111/api/Auth";

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function checkAccess() {
  const token = localStorage.getItem("token");
  const claims = token ? decodeJwt(token) : null;

  if (!token || !claims) {
    window.location.href = "../Register/Login.html"; 
    return false;
  }

  const role = claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const label = document.getElementById("currentUserLabel");
  if (label) label.textContent = `${claims.name || claims.sub || "User"} (${role ?? ""})`;
  return true;
}

function showStatus(message, type = "info") {
  const banner = document.getElementById("statusBanner");
  banner.textContent = message;
  banner.className = `status-banner ${type}`;
  banner.hidden = false;
}

document.getElementById("changePasswordForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    showStatus("New password and confirmation don't match.", "error");
    return;
  }

  const btn = document.getElementById("changePasswordBtn");
  btn.disabled = true;

  fetch(`${API_BASE}/ChangePassword`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ currentPassword, newPassword })
  })
    .then(async res => {
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Password update failed.");
      showStatus("Password updated successfully.", "success");
      document.getElementById("changePasswordForm").reset();
    })
    .catch(err => showStatus(err.message, "error"))
    .finally(() => { btn.disabled = false; });
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
});

document.addEventListener("DOMContentLoaded", checkAccess);