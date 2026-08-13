const API_BASE = "https://localhost:7111/PurchaseOrder";

let currentPurchaseOrders = [];
let editingPurchaseOrderId = null;
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

// Sets up the header (Sign In / Log Out, user label) and shows/hides
// the "+ Add Purchase Order" button. The Controller only requires
// [Authorize] (no role check), so any signed-in user can manage orders.
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
  document
    .getElementById("addPurchaseOrderBtn")
    .classList.toggle("hidden", !signedIn);

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

async function getAllPurchaseOrders() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/GetPurchaseOrders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 404) {
      currentPurchaseOrders = [];
      renderPurchaseOrders(currentPurchaseOrders);
      showStatus("There are no purchase orders yet.", "info");
      return;
    }

    if (!res.ok) throw new Error("Could not load purchase orders.");

    const result = await res.json();
    for (const po of result) {
      po.realId = po.purchaseOrderId;
    }
    currentPurchaseOrders = result;
    renderPurchaseOrders(currentPurchaseOrders);
    clearStatus();
  } catch (err) {
    showStatus(err.message, "error");
  }
}

function renderPurchaseOrders(orders) {
  const tbody = document.getElementById("purchaseOrdersTableBody");
  tbody.innerHTML = "";

  orders.forEach((po) => {
    const row = document.createElement("tr");

    const idCell = `<td>${po.realId ?? "-"}</td>`;
    const dateCell = `<td>${po.orderDate ? new Date(po.orderDate).toLocaleDateString() : "-"}</td>`;
    const statusCell = `<td>${po.status}</td>`;
    const totalCell = `<td>${po.totalAmount}</td>`;
    const supplierCell = `<td>${po.supplierId}</td>`;
    const userCell = `<td>${po.userId}</td>`;

    const disabled = po.realId === null ? "disabled" : "";
    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditModal(${po.realId})" ${disabled} type="button">Edit</button>`
      : "";
    const statusBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openStatusModal(${po.realId})" ${disabled} type="button">Status</button>`
      : "";
    const deleteBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="deletePurchaseOrder(${po.realId})" ${disabled} type="button">Delete</button>`
      : "";

    row.innerHTML = `${idCell}${dateCell}${statusCell}${totalCell}${supplierCell}${userCell}<td>${editBtn} ${statusBtn} ${deleteBtn}</td>`;
    tbody.appendChild(row);
  });
}

// ---- Add / Edit modal ----

document
  .getElementById("addPurchaseOrderBtn")
  ?.addEventListener("click", () => {
    editingPurchaseOrderId = null;
    document.getElementById("purchaseOrderModalTitle").textContent =
      "Add Purchase Order";
    document.getElementById("poStatus").value = "Pending";
    document.getElementById("poOrderDate").value = "";
    document.getElementById("poTotalAmount").value = "";
    document.getElementById("poSupplierId").value = "";
    document.getElementById("poUserId").value = "";
    new bootstrap.Modal(document.getElementById("purchaseOrderModal")).show();
  });

function openEditModal(id) {
  const po = currentPurchaseOrders.find((p) => p.realId === id);
  if (!po) return;

  editingPurchaseOrderId = id;
  document.getElementById("purchaseOrderModalTitle").textContent =
    "Edit Purchase Order";
  document.getElementById("poStatus").value = po.status;
  document.getElementById("poOrderDate").value = po.orderDate
    ? po.orderDate.split("T")[0]
    : "";
  document.getElementById("poTotalAmount").value = po.totalAmount;
  document.getElementById("poSupplierId").value = po.supplierId;
  document.getElementById("poUserId").value = po.userId;

  new bootstrap.Modal(document.getElementById("purchaseOrderModal")).show();
}

document
  .getElementById("savePurchaseOrderBtn")
  ?.addEventListener("click", () => {
    const status = document.getElementById("poStatus").value;
    const orderDate = document.getElementById("poOrderDate").value;
    const totalAmount = document.getElementById("poTotalAmount").value;
    const supplierId = document.getElementById("poSupplierId").value;
    const userId = document.getElementById("poUserId").value;

    if (!orderDate) {
      showStatus("Order date is required.", "error");
      return;
    }
    if (totalAmount === "" || parseFloat(totalAmount) < 0) {
      showStatus("Total amount is required and cannot be negative.", "error");
      return;
    }
    if (!supplierId) {
      showStatus("Supplier ID is required.", "error");
      return;
    }
    if (!userId) {
      showStatus("User ID is required.", "error");
      return;
    }

    const token = localStorage.getItem("token");

    if (editingPurchaseOrderId === null) {
      // Create
      fetch(`${API_BASE}/AddPurchaseOrder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          Status: status,
          OrderDate: orderDate,
          TotalAmount: parseFloat(totalAmount),
          SupplierId: parseInt(supplierId, 10),
          UserId: parseInt(userId, 10),
        }),
      })
        .then((res) =>
          res.ok ? getAllPurchaseOrders() : Promise.reject(res.status),
        )
        .then(() =>
          bootstrap.Modal.getInstance(
            document.getElementById("purchaseOrderModal"),
          ).hide(),
        )
        .catch((err) =>
          showStatus("Could not add purchase order: " + err, "error"),
        );
    } else {
      // Full update
      const params = new URLSearchParams({
        id: editingPurchaseOrderId,
        status,
        totalAmount,
        orderDate,
        supplierId,
        userId,
      });
      fetch(`${API_BASE}/UpdatePurchaseOrder?${params}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) =>
          res.ok ? getAllPurchaseOrders() : Promise.reject(res.status),
        )
        .then(() =>
          bootstrap.Modal.getInstance(
            document.getElementById("purchaseOrderModal"),
          ).hide(),
        )
        .catch((err) =>
          showStatus("Could not update purchase order: " + err, "error"),
        );
    }
  });

// ---- Status-only modal (second distinct update case) ----

function openStatusModal(id) {
  const po = currentPurchaseOrders.find((p) => p.realId === id);
  if (!po) return;

  editingPurchaseOrderId = id;
  document.getElementById("newStatusInput").value = po.status;
  new bootstrap.Modal(document.getElementById("statusModal")).show();
}

document.getElementById("saveStatusBtn")?.addEventListener("click", () => {
  const newStatus = document.getElementById("newStatusInput").value;
  const token = localStorage.getItem("token");

  fetch(
    `${API_BASE}/UpdatePurchaseOrderStatus?id=${editingPurchaseOrderId}&status=${newStatus}`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    },
  )
    .then((res) =>
      res.ok ? getAllPurchaseOrders() : Promise.reject(res.status),
    )
    .then(() =>
      bootstrap.Modal.getInstance(
        document.getElementById("statusModal"),
      ).hide(),
    )
    .catch((err) => showStatus("Could not update status: " + err, "error"));
});

// ---- Delete ----

function deletePurchaseOrder(id) {
  if (!confirm("Remove this purchase order? This can't be undone.")) return;

  const token = localStorage.getItem("token");
  fetch(`${API_BASE}/DeletePurchaseOrder?id=${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) =>
      res.ok ? getAllPurchaseOrders() : Promise.reject(res.status),
    )
    .catch((err) =>
      showStatus("Could not delete purchase order: " + err, "error"),
    );
}

// ---- Logout ----

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.reload();
});

// ---- Entry point ----

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();
  await getAllPurchaseOrders();
});
