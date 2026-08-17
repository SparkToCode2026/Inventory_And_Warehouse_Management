const API_BASE = "https://localhost:7111/Category";
const CATEGORY_API_BASE = "https://localhost:7111/Category";


let currentCategories = [];
let currentProducts = [];
let editingCategoryId = null;
let signedIn = false;   // true for any logged-in user (Edit/Price allowed)
let canManage = false;  // true only for Manager/Admin (Add/Delete)

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Sets up the header (Sign In / Log Out, user label) and shows/hides
// the "+ Add Category" button based on role. Unlike the Users page,
// Categories stay visible to everyone — only Add/Edit/Delete are gated.
function checkAccess() {
  const token = localStorage.getItem("token");
  const claims = token ? decodeJwt(token) : null;
  const role = claims?.role
    || claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
    || claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  const signedInResult = Boolean(token && claims);
  signedIn = signedInResult;
  canManage = signedInResult && (role === "Manager" || role === "Admin");

  document.getElementById("logoutBtn").classList.toggle("hidden", !signedInResult);
  document.getElementById("signInLink").classList.toggle("hidden", signedInResult);
  document.getElementById("addCategoryBtn").classList.toggle("hidden", !canManage);

  const label = document.getElementById("currentUserLabel");
  if (label) {
    label.textContent = signedInResult
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

// ---- Load data ----


async function getAllCategories() {
  try {
    const res = await fetch(`${API_BASE}/GetCategories`);

    if (res.status === 404) {
      currentCategories = [];
      renderCategories(currentCategories);
      showStatus("There are no categories yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load categories.");

    const result = await res.json();
    for (const category of result) {
      category.realId = category.categoryId;
    }
    currentCategories = result;
    renderCategories(currentCategories);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderCategories(categories) {
  const tbody = document.getElementById("CategoryTableBody");
  tbody.innerHTML = "";

  categories.forEach(c => {
    const row = document.createElement("tr");

    const idCell = `<td>${c.realId ?? "-"}</td>`;
    const nameCell = `<td>${c.name}</td>`;
    const descCell = `<td>${c.description ?? "-"}</td>`;
    const productsCell = `<td>${c.products?.length ?? 0}</td>`;

    const disabled = c.realId === null ? "disabled" : "";
    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditModal(${c.realId})" ${disabled} type="button">Edit</button>`
      : "";
    const descriptionBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openDescriptionModal(${c.realId})" ${disabled} type="button">Description</button>`
      : "";
    const deleteBtn = canManage
      ? `<button class="btn btn-outline btn-sm" onclick="deleteCategory(${c.realId})" ${disabled} type="button">Delete</button>`
      : "";

    row.innerHTML = `${idCell}${nameCell}${descCell}${productsCell}<td>${editBtn} ${descriptionBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Toolbar: filter / sort ----

document.getElementById("applyFilterBtn")?.addEventListener("click", async () => {
  const categoryName = document.getElementById("nameFilter").value;
  if (categoryName === "") { getAllCategories(); return; }

  try {
    const res = await fetch(`${API_BASE}/FilterCategoriesByName?name=${categoryName}`);
    if (res.status === 404) {
      currentCategories = [];
      renderCategories(currentCategories);
      showStatus("No categories match that name.", "info");
      return;
    }
    if (!res.ok) throw new Error("Could not filter categories.");
    const result = await res.json();
    for (const category of result) {
      category.realId = category.categoryId;
    }
    currentCategories = result;
    renderCategories(currentCategories);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  document.getElementById("nameFilter").value = "";
  getAllCategories();
});

document.getElementById("sortByProductsBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/SortCategoriesByNumOfProducts`);
    if (!res.ok) throw new Error("Could not sort categories.");
    const result = await res.json();
    for (const category of result) {
      category.realId = category.categoryId;
    }
    currentCategories = result;
    renderCategories(currentCategories);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

// ---- Add / Edit modal ----

document.getElementById("addCategoryBtn")?.addEventListener("click", () => {
  editingCategoryId = null;
  document.getElementById("categoryModalTitle").textContent = "Add Category";
  document.getElementById("categoryName").value = "";
  document.getElementById("categoryDescription").value = "";
  new bootstrap.Modal(document.getElementById("categoryModal")).show();
});

function openEditModal(id) {
  const category = currentCategories.find(c => c.realId === id);
  if (!category) return;

  editingCategoryId = id;
  document.getElementById("categoryModalTitle").textContent = "Edit Category";
  document.getElementById("categoryName").value = category.name;
  document.getElementById("categoryDescription").value = category.description ?? "";
  new bootstrap.Modal(document.getElementById("categoryModal")).show();
}

document.getElementById("saveCategoryBtn")?.addEventListener("click", () => {
  const name = document.getElementById("categoryName").value.trim();
  const description = document.getElementById("categoryDescription").value;

  if (!name) { showStatus("Name is required.", "error"); return; }


  const token = localStorage.getItem("token");

  if (editingCategoryId === null) {
    // Create
    fetch(`${API_BASE}/AddCategory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ Name: name, Description: description || null })
    })
      .then(res => res.ok ? getAllCategories() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide())
      .catch(err => showStatus("Could not add category: " + err, "error"));
  } else {
    // Full update
    const params = new URLSearchParams({ id: editingCategoryId, name, description: description || "" });
    fetch(`${API_BASE}/UpdateCategory?${params}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? getAllCategories() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("categoryModal")).hide())
      .catch(err => showStatus("Could not update category: " + err, "error"));
  }
});

// ---- Description-only modal (second distinct update case) ----

function openDescriptionModal(id) {
  const category = currentCategories.find(c => c.realId === id);
  if (!category) return;

  editingCategoryId = id;
  document.getElementById("newDescriptionInput").value = category.description;
  new bootstrap.Modal(document.getElementById("descriptionModal")).show();
}

document.getElementById("saveDescriptionBtn")?.addEventListener("click", () => {
  const newDescription = document.getElementById("newDescriptionInput").value;


  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/UpdateCategoryDescription?id=${editingCategoryId}&description=${encodeURIComponent(newDescription)}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllCategories() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("descriptionModal")).hide())
    .catch(err => showStatus("Could not update description: " + err, "error"));
});

// ---- Delete ----

function deleteCategory(id) {
  if (!confirm("Remove this category? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeleteCategory?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllCategories() : Promise.reject(res.status))
    .catch(err => showStatus("Could not delete category: " + err, "error"));
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();
  await getAllCategories();
});