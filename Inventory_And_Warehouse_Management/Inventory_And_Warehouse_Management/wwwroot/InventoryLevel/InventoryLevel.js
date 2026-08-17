const API_BASE = "https://localhost:7111/InventoryLevel";
let currentInventoryLevels = [];
let activeWarehouseId = null;
let activeProductId = null;
let currentUserRole = null;

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

  const allowed = !!(token && claims);

  if (!allowed) {
    document.getElementById("accessDenied")?.classList.remove("hidden");
    document.getElementById("pageContent")?.classList.add("hidden");
    return false;
  }

  currentUserRole = role;
  document.getElementById("pageContent")?.classList.remove("hidden");
  const label = document.getElementById("currentUserLabel");
  if (label) label.textContent = `${claims.name || claims.sub || "User"} (${role})`;
  return true;
}

function renderInventoryLevels(levels) {
  const tbody = document.getElementById("inventoryTableBody");
  tbody.innerHTML = "";

  const canDelete = currentUserRole === "Manager" || currentUserRole === "Admin";

  levels.forEach(item => {
    const row = document.createElement("tr");

    const warehouseId = item.warehouseId ?? item.WarehouseId;
    const productId = item.productId ?? item.ProductId;
    const qty = item.quantityOnHand ?? item.QuantityOnHand;
    const threshold = item.reorderThreshold ?? item.ReorderThreshold;

    const warehouseLabel = item.warehouse?.name ?? `#${warehouseId}`;
    const productLabel = item.product?.name ?? `#${productId}`;
    const isLow = qty < threshold;

    row.innerHTML = `
      <td>${warehouseLabel}</td>
      <td>${productLabel}</td>
      <td>${qty}</td>
      <td>${threshold}</td>
      <td>
        <span class="badge ${isLow ? 'bg-danger' : 'bg-success'}">
          ${isLow ? 'Low Stock' : 'OK'}
        </span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openEditModal(${warehouseId}, ${productId})" type="button">Edit</button>
        <button class="btn btn-outline btn-sm" onclick="openAdjustModal(${warehouseId}, ${productId})" type="button">Adjust</button>
        ${canDelete ? `<button class="btn btn-outline btn-sm" onclick="deleteInventoryLevel(${warehouseId}, ${productId})" type="button">Delete</button>` : ""}
      </td>`;
    tbody.appendChild(row);
  });
}

function getAllInventoryLevels() {
  fetch(`${API_BASE}/GetInventoryLevels`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      currentInventoryLevels = data;
      renderInventoryLevels(currentInventoryLevels);
    })
    .catch(error => console.error("Error fetching inventory levels:", error));
}

// Filter Low Stock
document.getElementById("lowStockFilterBtn")?.addEventListener("click", () => {
  fetch(`${API_BASE}/GetLowStock`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => {
      currentInventoryLevels = data;
      renderInventoryLevels(currentInventoryLevels);
    })
    .catch(err => console.error("Failed to load low stock:", err));
});

document.getElementById("showAllBtn")?.addEventListener("click", () => {
  document.getElementById("totalsSummary")?.classList.add("hidden");
  getAllInventoryLevels();
});

// Add Inventory Level
document.getElementById("openAddModalBtn")?.addEventListener("click", () => {
  document.getElementById("addWarehouseId").value = "";
  document.getElementById("addProductId").value = "";
  document.getElementById("addQuantityOnHand").value = "";
  document.getElementById("addReorderThreshold").value = "";

  new bootstrap.Modal(document.getElementById("addInventoryModal")).show();
});

document.getElementById("saveAddBtn")?.addEventListener("click", () => {
  const newLevel = {
    warehouseId: parseInt(document.getElementById("addWarehouseId").value, 10),
    productId: parseInt(document.getElementById("addProductId").value, 10),
    quantityOnHand: parseInt(document.getElementById("addQuantityOnHand").value, 10),
    reorderThreshold: parseInt(document.getElementById("addReorderThreshold").value, 10)
  };

  fetch(`${API_BASE}/AddInventoryLevel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(newLevel)
  })
    .then(res => res.ok ? getAllInventoryLevels() : res.text().then(t => Promise.reject(t)))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("addInventoryModal")).hide())
    .catch(err => alert("Add failed: " + err));
});

// Edit Inventory Level
function openEditModal(warehouseId, productId) {
  const item = currentInventoryLevels.find(
    x => (x.warehouseId ?? x.WarehouseId) === warehouseId && (x.productId ?? x.ProductId) === productId
  );
  if (!item) return;

  activeWarehouseId = warehouseId;
  activeProductId = productId;

  document.getElementById("editQuantityOnHand").value = item.quantityOnHand ?? item.QuantityOnHand;
  document.getElementById("editReorderThreshold").value = item.reorderThreshold ?? item.ReorderThreshold;

  new bootstrap.Modal(document.getElementById("editInventoryModal")).show();
}

document.getElementById("saveEditBtn")?.addEventListener("click", () => {
  const quantityOnHand = parseInt(document.getElementById("editQuantityOnHand").value, 10);
  const reorderThreshold = parseInt(document.getElementById("editReorderThreshold").value, 10);

  fetch(`${API_BASE}/UpdateInventoryLevel?warehouseId=${activeWarehouseId}&productId=${activeProductId}&quantityOnHand=${quantityOnHand}&reorderThreshold=${reorderThreshold}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.ok ? getAllInventoryLevels() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("editInventoryModal")).hide())
    .catch(err => alert("Update failed: " + err));
});

// Adjust Quantity
function openAdjustModal(warehouseId, productId) {
  activeWarehouseId = warehouseId;
  activeProductId = productId;
  document.getElementById("adjustDelta").value = "";

  new bootstrap.Modal(document.getElementById("adjustQtyModal")).show();
}

document.getElementById("saveAdjustBtn")?.addEventListener("click", () => {
  const delta = parseInt(document.getElementById("adjustDelta").value, 10);

  fetch(`${API_BASE}/AdjustQuantity?warehouseId=${activeWarehouseId}&productId=${activeProductId}&delta=${delta}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllInventoryLevels() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("adjustQtyModal")).hide())
    .catch(err => alert("Adjustment failed: " + err));
});

// Delete Inventory Level
function deleteInventoryLevel(warehouseId, productId) {
  if (!confirm("Remove this inventory level? This can't be undone.")) return;

  fetch(`${API_BASE}/DeleteInventoryLevel?warehouseId=${warehouseId}&productId=${productId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllInventoryLevels() : Promise.reject(res.status))
    .catch(err => alert("Could not delete inventory level: " + err));
}

// Totals by Product
document.getElementById("totalsBtn")?.addEventListener("click", () => {
  const box = document.getElementById("totalsSummary");
  fetch(`${API_BASE}/GetTotalQuantityByProduct`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => {
      box.innerHTML = data
        .map(d => `<span class="badge bg-secondary me-2">Product #${d.productId ?? d.ProductId}: ${d.totalQuantityOnHand ?? d.TotalQuantityOnHand} units</span>`)
        .join("");
      box.classList.remove("hidden");
    })
    .catch(err => console.error("Failed to load totals:", err));
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../index.html";
});

// Entry Point
document.addEventListener("DOMContentLoaded", () => {
  if (checkAccess()) {
    getAllInventoryLevels();
  }
});