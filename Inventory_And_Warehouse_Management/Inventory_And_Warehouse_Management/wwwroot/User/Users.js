const API_BASE = "https://localhost:7111/User";
let currentUsers = []; // Track loaded users globally
let editingUserId = null;

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
  const role = claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
 
  const allowed = token && claims && (role === "Manager" || role === "Admin");
 
  if (!allowed) {
    document.getElementById("accessDenied")?.classList.remove("hidden");
    document.getElementById("pageContent")?.classList.add("hidden");
    return false;
  }
 
  document.getElementById("pageContent")?.classList.remove("hidden");
  const label = document.getElementById("currentUserLabel");
  if (label) label.textContent = `${claims.name || claims.sub || "User"} (${role})`;
  return true;
}

function renderUsers(users) {
  const tbody = document.getElementById("usersTableBody");
  tbody.innerHTML = "";
 
  users.forEach(u => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${u.userId}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.phone ?? "-"}</td>
      <td>${u._warehouse?.name ?? "-"}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openEditModal(${u.userId})" type="button">Edit</button>
        <button class="btn btn-outline btn-sm" onclick="openRoleModal(${u.userId})" type="button">Role</button>
        <button class="btn btn-outline btn-sm" onclick="deleteUser(${u.userId})" type="button">Delete</button>
      </td>`;
    tbody.appendChild(row);
  });
}

function getAllUsers() {
  fetch(`${API_BASE}/GetAllUsers`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(response => response.json())
    .then(data => {
      currentUsers = data; 
      renderUsers(currentUsers);
    })
    .catch(error => console.error("Error fetching users:", error));
}

// Filter users by role
document.getElementById("roleFilter")?.addEventListener("change", (e) => {
  const role = e.target.value;
  if (!role) {
    getAllUsers();
    return;
  }
  fetch(`${API_BASE}/GetUsersByRole?role=${encodeURIComponent(role)}`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => { 
      currentUsers = data; 
      renderUsers(currentUsers); 
    })
    .catch(err => console.error("Failed to filter users:", err));
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  const select = document.getElementById("roleFilter");
  if (select) select.value = "";
  getAllUsers();
});

// Update user details
function openEditModal(id) {
  const user = currentUsers.find(u => u.userId === id);
  if (!user) return;
 
  editingUserId = id;
  document.getElementById("editName").value = user.name;
  document.getElementById("editEmail").value = user.email;
  document.getElementById("editRole").value = user.role;
  document.getElementById("editPhone").value = user.phone ?? "";
 
  new bootstrap.Modal(document.getElementById("editUserModal")).show();
}
 
document.getElementById("saveEditBtn")?.addEventListener("click", () => {
  const updated = {
    name: document.getElementById("editName").value,
    email: document.getElementById("editEmail").value,
    role: document.getElementById("editRole").value,
    phone: document.getElementById("editPhone").value,
  };

  fetch(`${API_BASE}/UpdateUser?id=${editingUserId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(updated)
  })
    .then(res => res.ok ? getAllUsers() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide())
    .catch(err => alert("Update failed: " + err));
});  

// Update user role
function openRoleModal(id) {
  editingUserId = id;
  const user = currentUsers.find(u => u.userId === id);
  const select = document.getElementById("newRoleSelect");
  if (select) select.value = user?.role ?? "Staff";
  
  new bootstrap.Modal(document.getElementById("changeRoleModal")).show();
}
 
document.getElementById("saveRoleBtn")?.addEventListener("click", () => {
  const newRole = document.getElementById("newRoleSelect").value;
  fetch(`${API_BASE}/UpdateUserRole?id=${editingUserId}&newRole=${encodeURIComponent(newRole)}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllUsers() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("changeRoleModal")).hide())
    .catch(err => alert("Role update failed: " + err));
});  

// Delete user
function deleteUser(id) {
  if (!confirm("Remove this user? This can't be undone.")) return;

  fetch(`${API_BASE}/RemoveUser?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllUsers() : Promise.reject(res.status))
    .catch(err => alert("Delete failed: " + err));
}

// Count users per warehouse
document.getElementById("countBtn")?.addEventListener("click", () => {
  const box = document.getElementById("warehouseCounts");
  fetch(`${API_BASE}/CountUsersPerWarehouse`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => {
      box.innerHTML = data
        .map(d => `<span class="badge bg-secondary me-2">Warehouse ${d.warehouseId ?? 'Unassigned'}: ${d.userCount}</span>`)
        .join("");
      box.classList.remove("hidden");
    })
    .catch(err => console.error("Failed to load counts:", err));
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
});

// Entry Point
document.addEventListener("DOMContentLoaded", () => {
  if (checkAccess()) {
    getAllUsers();
  }
});