const API_BASE = "https://localhost:7111/PurchaseOrderItem";

let currentItems = [];
let editingItemId = null;
let signedIn = false;

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
  const role =
    claims?.role ||
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  signedIn = Boolean(token && claims);

  document.getElementById("logoutBtn").classList.toggle("hidden", !signedIn);
  document.getElementById("signInLink").classList.toggle("hidden", signedIn);
  document.getElementById("addItemBtn").classList.toggle("hidden", !signedIn);

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

// ---- Load data ----

async function getAllItems() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/GetPurchaseOrderItems`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) {
      currentItems = [];
      renderItems(currentItems);
      showStatus("There are no purchase order items yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load purchase order items.");

    const result = await res.json();
    for (const item of result) {
      item.realId = item.purchaseOrderItemId;
    }
    currentItems = result;
    renderItems(currentItems);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderItems(items) {
  const tbody = document.getElementById("itemsTableBody");
  tbody.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");

    const idCell = `<td>${item.realId ?? "-"}</td>`;
    const poCell = `<td>${item.purchaseOrderId}</td>`;
    const productCell = `<td>${item.productId}</td>`;
    const qtyCell = `<td>${item.quantity}</td>`;
    const priceCell = `<td>${item.unitPrice}</td>`;
    const totalCell = `<td>${item.totalPrice}</td>`;

    const disabled = item.realId === null ? "disabled" : "";
    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditModal(${item.realId})" ${disabled} type="button">Edit</button>`
      : "";
    const qtyBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openQuantityModal(${item.realId})" ${disabled} type="button">Quantity</button>`
      : "";
    const deleteBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="deleteItem(${item.realId})" ${disabled} type="button">Delete</button>`
      : "";

    row.innerHTML = `${idCell}${poCell}${productCell}${qtyCell}${priceCell}${totalCell}<td>${editBtn} ${qtyBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Add / Edit modal ----

document.getElementById("addItemBtn")?.addEventListener("click", () => {
  editingItemId = null;
  document.getElementById("itemModalTitle").textContent = "Add Item";
  document.getElementById("itemPurchaseOrderId").value = "";
  document.getElementById("itemProductId").value = "";
  document.getElementById("itemQuantity").value = "";
  document.getElementById("itemUnitPrice").value = "";
  new bootstrap.Modal(document.getElementById("itemModal")).show();
});

function openEditModal(id) {
  const item = currentItems.find((i) => i.realId === id);
  if (!item) return;

  editingItemId = id;
  document.getElementById("itemModalTitle").textContent = "Edit Item";
  document.getElementById("itemPurchaseOrderId").value = item.purchaseOrderId;
  document.getElementById("itemProductId").value = item.productId;
  document.getElementById("itemQuantity").value = item.quantity;
  document.getElementById("itemUnitPrice").value = item.unitPrice;

  new bootstrap.Modal(document.getElementById("itemModal")).show();
}

document.getElementById("saveItemBtn")?.addEventListener("click", () => {
  const purchaseOrderId = document.getElementById("itemPurchaseOrderId").value;
  const productId = document.getElementById("itemProductId").value;
  const quantity = document.getElementById("itemQuantity").value;
  const unitPrice = document.getElementById("itemUnitPrice").value;

  if (!purchaseOrderId) {
    showStatus("Purchase Order ID is required.", "error");
    return;
  }
  if (!productId) {
    showStatus("Product ID is required.", "error");
    return;
  }
  if (quantity === "" || parseInt(quantity, 10) < 1) {
    showStatus("Quantity must be at least 1.", "error");
    return;
  }
  if (unitPrice === "" || parseFloat(unitPrice) < 0) {
    showStatus("Unit price is required and cannot be negative.", "error");
    return;
  }

  const token = localStorage.getItem("token");

  if (editingItemId === null) {
    // Create
    fetch(`${API_BASE}/AddPurchaseOrderItem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        PurchaseOrderId: parseInt(purchaseOrderId, 10),
        ProductId: parseInt(productId, 10),
        Quantity: parseInt(quantity, 10),
        UnitPrice: parseFloat(unitPrice),
      }),
    })
      .then((res) => (res.ok ? getAllItems() : Promise.reject(res.status)))
      .then(() =>
        bootstrap.Modal.getInstance(
          document.getElementById("itemModal"),
        ).hide(),
      )
      .catch((err) => showStatus("Could not add item: " + err, "error"));
  } else {
    // Full update
    const params = new URLSearchParams({
      id: editingItemId,
      purchaseOrderId,
      productId,
      quantity,
      unitPrice,
    });
    fetch(`${API_BASE}/UpdatePurchaseOrderItem?${params}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? getAllItems() : Promise.reject(res.status)))
      .then(() =>
        bootstrap.Modal.getInstance(
          document.getElementById("itemModal"),
        ).hide(),
      )
      .catch((err) => showStatus("Could not update item: " + err, "error"));
  }
});

// ---- Quantity-only modal (second distinct update case) ----

function openQuantityModal(id) {
  const item = currentItems.find((i) => i.realId === id);
  if (!item) return;

  editingItemId = id;
  document.getElementById("newQuantityInput").value = item.quantity;
  new bootstrap.Modal(document.getElementById("quantityModal")).show();
}

document.getElementById("saveQuantityBtn")?.addEventListener("click", () => {
  const newQuantity = document.getElementById("newQuantityInput").value;
  if (newQuantity === "" || parseInt(newQuantity, 10) < 1) {
    showStatus("Enter a valid quantity.", "error");
    return;
  }

  const token = localStorage.getItem("token");
  fetch(
    `${API_BASE}/UpdatePurchaseOrderItemQuantity?id=${editingItemId}&quantity=${newQuantity}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  )
    .then((res) => (res.ok ? getAllItems() : Promise.reject(res.status)))
    .then(() =>
      bootstrap.Modal.getInstance(
        document.getElementById("quantityModal"),
      ).hide(),
    )
    .catch((err) => showStatus("Could not update quantity: " + err, "error"));
});

// ---- Delete ----

function deleteItem(id) {
  if (!confirm("Remove this item? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeletePurchaseOrderItem?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => (res.ok ? getAllItems() : Promise.reject(res.status)))
    .catch((err) => showStatus("Could not delete item: " + err, "error"));
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();
  await getAllItems();
});
