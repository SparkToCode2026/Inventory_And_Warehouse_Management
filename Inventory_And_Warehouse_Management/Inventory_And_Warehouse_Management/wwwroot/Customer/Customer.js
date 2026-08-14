const API_BASE = "https://localhost:7111/Customer";

let currentCustomers = [];
let editingCustomerId = null;
let signedIn = false;   // true for any logged-in user (view/add/edit allowed)
let canManage = false;  // true only for Manager/Admin (Delete)

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Customer requires sign-in even to view (GetAllCustomers is [Authorize]),
// so unlike Product, the whole table is hidden when signed out.
function checkAccess() {
  const token = localStorage.getItem("token");
  const claims = token ? decodeJwt(token) : null;
  const role = claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    || claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  signedIn = Boolean(token && claims);
  canManage = signedIn && (role === "Manager" || role === "Admin");

  document.getElementById("logoutBtn").classList.toggle("hidden", !signedIn);
  document.getElementById("signInLink").classList.toggle("hidden", signedIn);
  document.getElementById("addCustomerBtn").classList.toggle("hidden", !signedIn);

  document.getElementById("signedOutNotice").classList.toggle("hidden", signedIn);
  document.getElementById("customerTableWrap").classList.toggle("hidden", !signedIn);

  const label = document.getElementById("currentUserLabel");
  if (label) {
    label.textContent = signedIn
      ? `${claims.name || claims.sub || "User"} (${role || "Unknown"})`
      : "";
  }
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

async function getAllCustomers() {
  if (!signedIn) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/GetAllCustomers`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) throw new Error("Your login session is invalid or expired.");
    if (res.status === 403) throw new Error("You are not allowed to access customers.");

    if (res.status === 404) {
      currentCustomers = [];
      renderCustomers(currentCustomers);
      showStatus("There are no customers yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load customers.");

    currentCustomers = await res.json();
    renderCustomers(currentCustomers);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderCustomers(customers) {
  const tbody = document.getElementById("customersTableBody");
  tbody.innerHTML = "";

  customers.forEach(c => {
    const row = document.createElement("tr");

    const idCell = `<td>${c.customerId}</td>`;
    const nameCell = `<td>${c.name}</td>`;
    const emailCell = `<td>${c.email}</td>`;
    const phoneCell = `<td>${c.phone}</td>`;
    const locationCell = `<td>${c.location ?? "-"}</td>`;

    const editBtn = `<button class="btn btn-outline btn-sm" onclick="openEditModal(${c.customerId})" type="button">Edit</button>`;
    const locationBtn = `<button class="btn btn-outline btn-sm" onclick="openLocationModal(${c.customerId})" type="button">Location</button>`;
    const deleteBtn = canManage
      ? `<button class="btn btn-outline btn-sm" onclick="deleteCustomer(${c.customerId})" type="button">Delete</button>`
      : "";

    row.innerHTML = `${idCell}${nameCell}${emailCell}${phoneCell}${locationCell}<td>${editBtn} ${locationBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Toolbar: filter / sort ----

document.getElementById("applyFilterBtn")?.addEventListener("click", async () => {
  const name = document.getElementById("nameFilter").value.trim();
  if (name === "") { getAllCustomers(); return; }

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/FilterCustomersByName?name=${encodeURIComponent(name)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 404) {
      currentCustomers = [];
      renderCustomers(currentCustomers);
      showStatus("No customers match that name.", "info");
      return;
    }
    if (!res.ok) throw new Error("Could not filter customers.");
    currentCustomers = await res.json();
    renderCustomers(currentCustomers);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  document.getElementById("nameFilter").value = "";
  getAllCustomers();
});

document.getElementById("sortByOrdersBtn")?.addEventListener("click", async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/SortCustomersByNumOfSalesOrders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Could not sort customers.");
    currentCustomers = await res.json();
    renderCustomers(currentCustomers);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

// ---- Add / Edit modal ----

document.getElementById("addCustomerBtn")?.addEventListener("click", () => {
  editingCustomerId = null;
  document.getElementById("customerModalTitle").textContent = "Add Customer";
  document.getElementById("customerName").value = "";
  document.getElementById("customerEmail").value = "";
  document.getElementById("customerPhone").value = "";
  document.getElementById("customerLocation").value = "";
  new bootstrap.Modal(document.getElementById("customerModal")).show();
});

function openEditModal(id) {
  const customer = currentCustomers.find(c => c.customerId === id);
  if (!customer) return;

  editingCustomerId = id;
  document.getElementById("customerModalTitle").textContent = "Edit Customer";
  document.getElementById("customerName").value = customer.name;
  document.getElementById("customerEmail").value = customer.email;
  document.getElementById("customerPhone").value = customer.phone;
  document.getElementById("customerLocation").value = customer.location ?? "";

  new bootstrap.Modal(document.getElementById("customerModal")).show();
}

document.getElementById("saveCustomerBtn")?.addEventListener("click", () => {
  const name = document.getElementById("customerName").value.trim();
  const email = document.getElementById("customerEmail").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const location = document.getElementById("customerLocation").value.trim();

  if (!name) { showStatus("Name is required.", "error"); return; }
  if (!email) { showStatus("Email is required.", "error"); return; }
  if (!phone) { showStatus("Phone is required.", "error"); return; }

  const token = localStorage.getItem("token");

  if (editingCustomerId === null) {
    fetch(`${API_BASE}/AddCustomer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ Name: name, Email: email, Phone: phone, Location: location || null })
    })
      .then(res => res.ok ? getAllCustomers() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("customerModal")).hide())
      .catch(err => showStatus("Could not add customer: " + err, "error"));
  } else {
    const params = new URLSearchParams({ id: editingCustomerId, name, email, phone, location: location || "" });
    fetch(`${API_BASE}/UpdateCustomer?${params}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? getAllCustomers() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("customerModal")).hide())
      .catch(err => showStatus("Could not update customer: " + err, "error"));
  }
});

// ---- Location-only modal (second distinct update case) ----

function openLocationModal(id) {
  const customer = currentCustomers.find(c => c.customerId === id);
  if (!customer) return;

  editingCustomerId = id;
  document.getElementById("newLocationInput").value = customer.location ?? "";
  new bootstrap.Modal(document.getElementById("locationModal")).show();
}

document.getElementById("saveLocationBtn")?.addEventListener("click", () => {
  const newLocation = document.getElementById("newLocationInput").value.trim();
  if (!newLocation) { showStatus("Enter a valid location.", "error"); return; }

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/UpdateCustomerLocation?id=${editingCustomerId}&location=${encodeURIComponent(newLocation)}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllCustomers() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("locationModal")).hide())
    .catch(err => showStatus("Could not update location: " + err, "error"));
});

// ---- Delete ----

function deleteCustomer(id) {
  if (!confirm("Remove this customer? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeleteCustomer?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => {
      if (res.status === 403) return Promise.reject("Only Manager or Admin users can delete customers.");
      return res.ok ? getAllCustomers() : Promise.reject(res.status);
    })
    .catch(err => showStatus("Could not delete customer: " + err, "error"));
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();
  await getAllCustomers();
});