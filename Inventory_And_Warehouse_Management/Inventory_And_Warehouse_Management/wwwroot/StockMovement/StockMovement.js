const API_BASE = "https://localhost:7111/StockMovement";
let currentMovements = []; 
let editingMovementId = null;
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

function updateMovementTypeOptions(movements) {
  const datalist = document.getElementById("movementTypeOptions");
  if (!datalist) return;
  const types = [...new Set(movements.map(m => m.movementType).filter(Boolean))];
  datalist.innerHTML = types.map(t => `<option value="${t}"></option>`).join("");
}

function renderMovements(movements) {
  updateMovementTypeOptions(movements);

  const tbody = document.getElementById("movementsTableBody");
  tbody.innerHTML = "";

  const canDelete = currentUserRole === "Manager" || currentUserRole === "Admin";

  movements.forEach(m => {
    const row = document.createElement("tr");
    const productLabel = m.product?.name ?? `#${m.productId}`;
    const warehouseLabel = m._warehouse?.name ?? `#${m.warehouseId}`;
    const dateLabel = m.movementDate ? new Date(m.movementDate).toLocaleString() : "-";

    row.innerHTML = `
      <td>${m.stockMovementId}</td>
      <td>${productLabel}</td>
      <td>${warehouseLabel}</td>
      <td>${m.movementType}</td>
      <td>${m.quantity}</td>
      <td>${dateLabel}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="openEditModal(${m.stockMovementId})" type="button">Edit</button>
        <button class="btn btn-outline btn-sm" onclick="openQtyModal(${m.stockMovementId})" type="button">Qty</button>
        ${canDelete ? `<button class="btn btn-outline btn-sm" onclick="deleteMovement(${m.stockMovementId})" type="button">Delete</button>` : ""}
      </td>`;
    tbody.appendChild(row);
  });
}

function getAllMovements() {
  fetch(`${API_BASE}/GetAllStockMovements`, {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    }
  })
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      currentMovements = data;
      renderMovements(currentMovements);
    })
    .catch(error => console.error("Error fetching stock movements:", error));
}

// Filter movements by date range
document.getElementById("dateFilterBtn")?.addEventListener("click", () => {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (!start || !end) {
    alert("Pick both a start and end date.");
    return;
  }

  fetch(`${API_BASE}/GetStockMovementsByDate?startDate=${start}&endDate=${end}`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => {
      currentMovements = data;
      renderMovements(currentMovements);
    })
    .catch(err => console.error("Failed to filter movements:", err));
});

document.getElementById("clearFilterBtn")?.addEventListener("click", () => {
  document.getElementById("startDate").value = "";
  document.getElementById("endDate").value = "";
  getAllMovements();
});

// Add movement
document.getElementById("addMovementBtn")?.addEventListener("click", () => {
  document.getElementById("addProductId").value = "";
  document.getElementById("addWarehouseId").value = "";
  document.getElementById("addQuantity").value = "";
  document.getElementById("addMovementType").value = "IN";
  document.getElementById("addMovementDate").value = "";

  new bootstrap.Modal(document.getElementById("addMovementModal")).show();
});

document.getElementById("saveAddBtn")?.addEventListener("click", () => {
  const movementType = document.getElementById("addMovementType").value.trim();
  if (!movementType) {
    alert("Movement Type is required.");
    return;
  }

  const newMovement = {
    productId: parseInt(document.getElementById("addProductId").value, 10),
    warehouseId: parseInt(document.getElementById("addWarehouseId").value, 10),
    quantity: parseInt(document.getElementById("addQuantity").value, 10),
    movementType: movementType,
    movementDate: document.getElementById("addMovementDate").value || new Date().toISOString()
  };

  fetch(`${API_BASE}/AddStockMovement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(newMovement)
  })
    .then(res => res.ok ? getAllMovements() : res.text().then(t => Promise.reject(t)))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("addMovementModal")).hide())
    .catch(err => alert("Add failed: " + err));
});

// Edit movement (full update)
function openEditModal(id) {
  const m = currentMovements.find(x => x.stockMovementId === id);
  if (!m) return;

  editingMovementId = id;
  document.getElementById("editProductId").value = m.productId;
  document.getElementById("editWarehouseId").value = m.warehouseId;
  document.getElementById("editQuantity").value = m.quantity;
  document.getElementById("editMovementType").value = m.movementType;
  document.getElementById("editMovementDate").value = m.movementDate ? m.movementDate.slice(0, 16) : "";

  new bootstrap.Modal(document.getElementById("editMovementModal")).show();
}

document.getElementById("saveEditBtn")?.addEventListener("click", () => {
  const movementType = document.getElementById("editMovementType").value.trim();
  if (!movementType) {
    alert("Movement Type is required.");
    return;
  }

  const updated = {
    productId: parseInt(document.getElementById("editProductId").value, 10),
    warehouseId: parseInt(document.getElementById("editWarehouseId").value, 10),
    quantity: parseInt(document.getElementById("editQuantity").value, 10),
    movementType: movementType,
    movementDate: document.getElementById("editMovementDate").value
  };

  fetch(`${API_BASE}/UpdateStockMovement?id=${editingMovementId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(updated)
  })
    .then(res => res.ok ? getAllMovements() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("editMovementModal")).hide())
    .catch(err => alert("Update failed: " + err));
});

// Quick quantity update
function openQtyModal(id) {
  editingMovementId = id;
  const m = currentMovements.find(x => x.stockMovementId === id);
  document.getElementById("newQuantity").value = m?.quantity ?? "";

  new bootstrap.Modal(document.getElementById("qtyModal")).show();
}

document.getElementById("saveQtyBtn")?.addEventListener("click", () => {
  const newQuantity = parseInt(document.getElementById("newQuantity").value, 10);

  fetch(`${API_BASE}/UpdateStockMovementQuantity?id=${editingMovementId}&newQuantity=${newQuantity}`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllMovements() : Promise.reject(res.status))
    .then(() => bootstrap.Modal.getInstance(document.getElementById("qtyModal")).hide())
    .catch(err => alert("Quantity update failed: " + err));
});

// Delete movement 
function deleteMovement(id) {
  if (!confirm("Remove this stock movement? This can't be undone.")) return;

  fetch(`${API_BASE}/RemoveStockMovement?id=${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.ok ? getAllMovements() : Promise.reject(res.status))
    .catch(err => showStatus("Could not delete movement: " + err, "error"));
}

// Totals by movement type
document.getElementById("sumBtn")?.addEventListener("click", () => {
  const box = document.getElementById("movementSums");
  fetch(`${API_BASE}/SumQuantityByMovementType`, {
    headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
  })
    .then(res => res.json())
    .then(data => {
      box.innerHTML = data
        .map(d => `<span class="badge bg-secondary me-2">${d.movementType}: ${d.totalQuantity}</span>`)
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
    getAllMovements();
  }
});