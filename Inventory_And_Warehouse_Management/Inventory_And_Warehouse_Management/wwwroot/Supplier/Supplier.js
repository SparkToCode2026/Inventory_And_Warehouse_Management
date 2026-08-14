const API_BASE = "https://localhost:7111/Supplier";

let currentSuppliers = [];
let editingSupplierId = null;

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// SupplierController requires Manager/Admin at the class level, so unlike
// Product/Customer this page is all-or-nothing: either you're a
// Manager/Admin and see everything, or you see an access-denied wall.
function checkAccess() {
  const token = localStorage.getItem("token");
  const claims = token ? decodeJwt(token) : null;
  const role = claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    || claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  const signedIn = Boolean(token && claims);
  const canManage = signedIn && (role === "Manager" || role === "Admin");

  document.getElementById("accessDenied").classList.toggle("hidden", canManage);
  document.getElementById("pageContent").classList.toggle("hidden", !canManage);

  const label = document.getElementById("currentUserLabel");
  if (label && signedIn) {
    label.textContent = `${claims.name || claims.sub || "User"} (${role || "Unknown"})`;
  }

  return canManage;
}

function showStatus(message, type = "info") {
  const banner = document.getElementById("statusBanner");
  banner.textContent = message;
  banner.className = `status-banner ${type}`;
  banner.classList.remove("hidden");
}

function clearStatus() {
  document.getElementById("statusBanner").classList.add("hidden");
}

async function getAllSuppliers() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/GetAllSuppliers`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) throw new Error("Your login session is invalid or expired.");
    if (res.status === 403) throw new Error("Only Manager or Admin users can access suppliers.");

    if (res.status === 404) {
      currentSuppliers = [];
      renderSuppliers(currentSuppliers);
      showStatus("There are no suppliers yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load suppliers.");

    currentSuppliers = await res.json();
    renderSuppliers(currentSuppliers);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderSuppliers(suppliers) {
  const tbody = document.getElementById("suppliersTableBody");
  tbody.innerHTML = "";

  suppliers.forEach(s => {
    const row = document.createElement("tr");

    const idCell = `<td>${s.supplierId}</td>`;
    const nameCell = `<td>${s.name}</td>`;
    const emailCell = `<td>${s.email}</td>`;
    const phoneCell = `<td>${s.phone}</td>`;

    const editBtn = `<button class="btn btn-outline btn-sm" onclick="openEditModal(${s.supplierId})" type="button">Edit</button>`;
    const emailBtn = `<button class="btn btn-outline btn-sm" onclick="openEmailModal(${s.supplierId})" type="button">Email</button>`;
    const deleteBtn = `<button class="btn btn-outline btn-sm" onclick="deleteSupplier(${s.supplierId})" type="button">Delete</button>`;

    row.innerHTML = `${idCell}${nameCell}${emailCell}${phoneCell}<td>${editBtn} ${emailBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Toolbar: filter / sort ----

document.getElementById("applyFilterBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("nameFilter").value.trim();
  if (name === "") { getAllSuppliers(); return; }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/FilterSuppliersByName?name=${encodeURIComponent(name)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 404) {
      currentSuppliers = [];
      renderSuppliers(currentSuppliers);
      showStatus("No suppliers match that name.", "info");
      return;
    }
    if (!res.ok) throw new Error("Could not filter suppliers.");
    currentSuppliers = await res.json();
    renderSuppliers(currentSuppliers);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  document.getElementById("nameFilter").value = "";
  getAllSuppliers();
});

document.getElementById("sortByOrdersBtn")?.addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/SortSuppliersByNumOfPurchaseOrders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Could not sort suppliers.");
    currentSuppliers = await res.json();
    renderSuppliers(currentSuppliers);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

// ---- Add / Edit modal ----

document.getElementById("addSupplierBtn")?.addEventListener("click", () => {
  editingSupplierId = null;
  document.getElementById("supplierModalTitle").textContent = "Add Supplier";
  document.getElementById("supplierName").value = "";
  document.getElementById("supplierEmail").value = "";
  document.getElementById("supplierPhone").value = "";
  new bootstrap.Modal(document.getElementById("supplierModal")).show();
});

function openEditModal(id) {
  const supplier = currentSuppliers.find(s => s.supplierId === id);
  if (!supplier) return;

  editingSupplierId = id;
  document.getElementById("supplierModalTitle").textContent = "Edit Supplier";
  document.getElementById("supplierName").value = supplier.name;
  document.getElementById("supplierEmail").value = supplier.email;
  document.getElementById("supplierPhone").value = supplier.phone;

  new bootstrap.Modal(document.getElementById("supplierModal")).show();
}

document.getElementById("saveSupplierBtn")?.addEventListener("click", () => {
  const name = document.getElementById("supplierName").value.trim();
  const email = document.getElementById("supplierEmail").value.trim();
  const phone = document.getElementById("supplierPhone").value.trim();

  if (!name) { showStatus("Name is required.", "error"); return; }
  if (!email) { showStatus("Email is required.", "error"); return; }
  if (!phone) { showStatus("Phone is required.", "error"); return; }

  const token = localStorage.getItem("token");

  if (editingSupplierId === null) {
    fetch(`${API_BASE}/AddSupplier`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ Name: name, Email: email, Phone: phone })
    })
      .then(res => res.ok ? getAllSuppliers() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("supplierModal")).hide())
      .catch(err => showStatus("Could not add supplier: " + err, "error"));
  } else {
    const params = new URLSearchParams({ id: editingSupplierId, name, email, phone });
    fetch(`${API_BASE}/UpdateSupplier?${params}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? getAllSuppliers() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("supplierModal")).hide())
      .catch(err => showStatus("Could not update supplier: " + err, "error"));
  }
});

// ---- Email-only modal (second distinct update case) ----

function openEmailModal(id) {
  const supplier = currentSuppliers.find(s => s.supplierId === id);
  if (!supplier) return;

  editingSupplierId = id;
  document.getElementById("newEmailInput").value = supplier.email;
  new bootstrap.Modal(document.getElementById("emailModal")).show();
}

document.getElementById("saveEmailBtn")?.addEventListener("click", () => {
  const newEmail = document.getElementById("newEmailInput").value.trim();
  if (!newEmail) { showStatus("Enter a valid email.", "error"); return; }

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/UpdateSupplierEmail?id=${editingSupplierId}&email=${encodeURIComponent(newEmail)}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllSuppliers() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("emailModal")).hide())
    .catch(err => showStatus("Could not update email: " + err, "error"));
});

// ---- Delete ----

function deleteSupplier(id) {
  if (!confirm("Remove this supplier? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeleteSupplier?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllSuppliers() : Promise.reject(res.status))
    .catch(err => showStatus("Could not delete supplier: " + err, "error"));
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  const canManage = checkAccess();
  if (canManage) {
    await getAllSuppliers();
  }
});