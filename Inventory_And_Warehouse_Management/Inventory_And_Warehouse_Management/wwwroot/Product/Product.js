const API_BASE = "https://localhost:7111/Product";
const CATEGORY_API_BASE = "https://localhost:7111/Category";

let currentProducts = [];
let currentCategories = [];
let editingProductId = null;
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
// the "+ Add Product" button based on role. Unlike the Users page,
// Products stay visible to everyone — only Add/Edit/Delete are gated.
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
  document.getElementById("addProductBtn").classList.toggle("hidden", !canManage);

  const label = document.getElementById("currentUserLabel");
  if (label) {
    label.textContent = signedInResult
      ? `${claims.name || claims.sub || "User"} (${role || "Unknown"})`
      : "";
  }
}

// ---- ID lookups (ProductId / CategoryId are hidden via [JsonIgnore]) ----

async function findCategoryId(category) {
  for (let id = 1; id <= 200; id++) {
    const res = await fetch(`${CATEGORY_API_BASE}/GetCategory?id=${id}`);
    if (res.status === 404 || !res.ok) continue;
    const result = await res.json();
    if (result.name === category.name) return id;
  }
  return null;
}

async function findProductId(product) {
  for (let id = 1; id <= 200; id++) {
    const res = await fetch(`${API_BASE}/GetProduct?id=${id}`);
    if (res.status === 404 || !res.ok) continue;
    const result = await res.json();
    if (
      result.name === product.name &&
      result.price === product.price &&
      result.description === product.description
    ) return id;
  }
  return null;
}

function categoryNameFor(categoryId) {
  const match = currentCategories.find(c => c.realId === categoryId);
  return match ? match.name : `Category #${categoryId}`;
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

async function loadCategories() {
  try {
    const res = await fetch(`${CATEGORY_API_BASE}/GetCategories`);
    if (res.status === 404) { currentCategories = []; return; }
    if (!res.ok) throw new Error("Could not load categories.");

    const result = await res.json();
    for (const category of result) {
      category.realId = await findCategoryId(category);
    }
    currentCategories = result;

    const select = document.getElementById("productCategory");
    select.innerHTML = '<option value="">Select a category</option>';
    currentCategories.forEach(category => {
      if (category.realId === null) return;
      const option = document.createElement("option");
      option.value = category.realId;
      option.textContent = category.name;
      select.appendChild(option);
    });
  } catch (err) {
    showStatus(err.message, "error");
  }
}

async function getAllProducts() {
  try {
    const res = await fetch(`${API_BASE}/GetProducts`);

    if (res.status === 404) {
      currentProducts = [];
      renderProducts(currentProducts);
      showStatus("There are no products yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load products.");

    const result = await res.json();
    for (const product of result) {
      product.realId = await findProductId(product);
    }
    currentProducts = result;
    renderProducts(currentProducts);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderProducts(products) {
  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = "";

  products.forEach(p => {
    const row = document.createElement("tr");

    const idCell = `<td>${p.realId ?? "-"}</td>`;
    const nameCell = `<td>${p.name}</td>`;
    const priceCell = `<td>${p.price}</td>`;
    const descCell = `<td>${p.description ?? "-"}</td>`;
    const categoryCell = `<td>${categoryNameFor(p.categoryId)}</td>`;

    const disabled = p.realId === null ? "disabled" : "";
    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditModal(${p.realId})" ${disabled} type="button">Edit</button>`
      : "";
    const priceBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openPriceModal(${p.realId})" ${disabled} type="button">Price</button>`
      : "";
    const deleteBtn = canManage
      ? `<button class="btn btn-outline btn-sm" onclick="deleteProduct(${p.realId})" ${disabled} type="button">Delete</button>`
      : "";

    row.innerHTML = `${idCell}${nameCell}${priceCell}${descCell}${categoryCell}<td>${editBtn} ${priceBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Toolbar: filter / sort ----

document.getElementById("applyFilterBtn")?.addEventListener("click", async () => {
  const maxPrice = document.getElementById("maxPriceFilter").value;
  if (maxPrice === "") { getAllProducts(); return; }

  try {
    const res = await fetch(`${API_BASE}/ProductsMaxPrice?maxPrice=${maxPrice}`);
    if (res.status === 404) {
      currentProducts = [];
      renderProducts(currentProducts);
      showStatus("No products match that price.", "info");
      return;
    }
    if (!res.ok) throw new Error("Could not filter products.");
    const result = await res.json();
    for (const product of result) {
      product.realId = await findProductId(product);
    }
    currentProducts = result;
    renderProducts(currentProducts);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  document.getElementById("maxPriceFilter").value = "";
  getAllProducts();
});

document.getElementById("sortByPriceBtn")?.addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/SortProductsByPrice`);
    if (!res.ok) throw new Error("Could not sort products.");
    const result = await res.json();
    for (const product of result) {
      product.realId = await findProductId(product);
    }
    currentProducts = result;
    renderProducts(currentProducts);
  } catch (err) {
    showStatus(err.message, "error");
  }
});

// ---- Add / Edit modal ----

document.getElementById("addProductBtn")?.addEventListener("click", () => {
  editingProductId = null;
  document.getElementById("productModalTitle").textContent = "Add Product";
  document.getElementById("productName").value = "";
  document.getElementById("productPrice").value = "";
  document.getElementById("productDescription").value = "";
  document.getElementById("productCategory").value = "";
  new bootstrap.Modal(document.getElementById("productModal")).show();
});

function openEditModal(id) {
  const product = currentProducts.find(p => p.realId === id);
  if (!product) return;

  editingProductId = id;
  document.getElementById("productModalTitle").textContent = "Edit Product";
  document.getElementById("productName").value = product.name;
  document.getElementById("productPrice").value = product.price;
  document.getElementById("productDescription").value = product.description ?? "";
  document.getElementById("productCategory").value = product.categoryId;

  new bootstrap.Modal(document.getElementById("productModal")).show();
}

document.getElementById("saveProductBtn")?.addEventListener("click", () => {
  const name = document.getElementById("productName").value.trim();
  const price = document.getElementById("productPrice").value;
  const description = document.getElementById("productDescription").value;
  const categoryId = document.getElementById("productCategory").value;

  if (!name) { showStatus("Name is required.", "error"); return; }
  if (price === "" || parseFloat(price) < 0) { showStatus("Price is required and cannot be negative.", "error"); return; }
  if (!categoryId) { showStatus("Please select a category.", "error"); return; }

  const token = localStorage.getItem("token");

  if (editingProductId === null) {
    // Create
    fetch(`${API_BASE}/AddProduct`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ Name: name, Price: parseFloat(price), Description: description || null, CategoryId: parseInt(categoryId, 10) })
    })
      .then(res => res.ok ? getAllProducts() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("productModal")).hide())
      .catch(err => showStatus("Could not add product: " + err, "error"));
  } else {
    // Full update
    const params = new URLSearchParams({ id: editingProductId, name, price, description: description || "" });
    fetch(`${API_BASE}/UpdateProduct?${params}`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? getAllProducts() : Promise.reject(res.status))
      .then(() => bootstrap.Modal.getInstance(document.getElementById("productModal")).hide())
      .catch(err => showStatus("Could not update product: " + err, "error"));
  }
});

// ---- Price-only modal (second distinct update case) ----

function openPriceModal(id) {
  const product = currentProducts.find(p => p.realId === id);
  if (!product) return;

  editingProductId = id;
  document.getElementById("newPriceInput").value = product.price;
  new bootstrap.Modal(document.getElementById("priceModal")).show();
}

document.getElementById("savePriceBtn")?.addEventListener("click", () => {
  const newPrice = document.getElementById("newPriceInput").value;
  if (newPrice === "" || parseFloat(newPrice) < 0) { showStatus("Enter a valid price.", "error"); return; }

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/UpdateProductPrice?id=${editingProductId}&price=${newPrice}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllProducts() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("priceModal")).hide())
    .catch(err => showStatus("Could not update price: " + err, "error"));
});

// ---- Delete ----

function deleteProduct(id) {
  if (!confirm("Remove this product? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeleteProduct?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(res => res.ok ? getAllProducts() : Promise.reject(res.status))
    .catch(err => showStatus("Could not delete product: " + err, "error"));
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();
  await loadCategories();
  await getAllProducts();
});