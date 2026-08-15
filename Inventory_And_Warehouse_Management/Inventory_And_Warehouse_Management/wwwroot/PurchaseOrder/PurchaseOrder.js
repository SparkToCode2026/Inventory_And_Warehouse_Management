const API_BASE = "https://localhost:7111/PurchaseOrder";
const TOKEN_KEY = "token";

let currentPurchaseOrders = [];
let signedIn = false;
let sortDescending = true;
let editingPurchaseOrderId = null;

// ============================================================
// JWT
// ============================================================

function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function currentUserId() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const claims = decodeJwt(token);
  if (!claims) return null;

  return (
    claims.sub ??
    claims[
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
    ] ??
    null
  );
}

// ============================================================
// ACCESS
// ============================================================

function checkAccess() {
  const token = localStorage.getItem(TOKEN_KEY);
  const claims = token ? decodeJwt(token) : null;

  const role =
    claims?.role ||
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  signedIn = Boolean(token && claims);

  document.getElementById("logoutBtn")?.classList.toggle("hidden", !signedIn);

  document.getElementById("signInLink")?.classList.toggle("hidden", signedIn);

  document
    .getElementById("addPurchaseOrderBtn")
    ?.classList.toggle("hidden", !signedIn);

  const label = document.getElementById("currentUserLabel");

  if (label) {
    label.textContent = signedIn
      ? `${claims.name || claims.sub || "User"} (${role || "Unknown"})`
      : "";
  }
}

// ============================================================
// STATUS
// ============================================================

function showStatus(message, type = "info") {
  const banner = document.getElementById("statusBanner");

  banner.textContent = message;
  banner.className = `status-banner ${type}`;

  banner.classList.remove("hidden");
}

function clearStatus() {
  document.getElementById("statusBanner")?.classList.add("hidden");
}

// ============================================================
// FRIENDLY ERROR HANDLING
// ============================================================

function getFriendlyErrorMessage(status, action) {
  switch (status) {
    case 401:
      return "You are not signed in or your session has expired. Please sign in and try again.";

    case 403:
      return "You do not have permission to perform this action.";

    case 404:
      return "The requested purchase order was not found.";

    case 400:
      return "The request is invalid. Please check the information and try again.";

    case 500:
      return "The server encountered a problem. Please try again later.";

    default:
      return `Could not ${action}. Please try again.`;
  }
}

async function checkResponse(response, action) {
  if (response.ok) {
    return response;
  }

  throw new Error(getFriendlyErrorMessage(response.status, action));
}

// ============================================================
// HELPERS
// ============================================================

function getSupplierName(purchaseOrder) {
  return (
    purchaseOrder.supplier?.name ||
    purchaseOrder.Supplier?.Name ||
    purchaseOrder.supplierName ||
    purchaseOrder.SupplierName ||
    purchaseOrder.supplierId ||
    purchaseOrder.SupplierId ||
    "-"
  );
}

function getPurchaseOrderId(purchaseOrder) {
  return purchaseOrder.purchaseOrderId ?? purchaseOrder.PurchaseOrderId ?? "-";
}

function getStatus(purchaseOrder) {
  return purchaseOrder.status ?? purchaseOrder.Status ?? "-";
}

function getOrderDate(purchaseOrder) {
  return purchaseOrder.orderDate ?? purchaseOrder.OrderDate ?? "-";
}

function getTotalAmount(purchaseOrder) {
  return Number(purchaseOrder.totalAmount ?? purchaseOrder.TotalAmount ?? 0);
}

// ============================================================
// RENDER PURCHASE ORDERS
// ============================================================

function renderPurchaseOrders(purchaseOrders) {
  const tbody = document.getElementById("purchaseOrdersTableBody");

  tbody.innerHTML = "";

  if (!purchaseOrders || purchaseOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          No purchase orders found.
        </td>
      </tr>
    `;

    return;
  }

  purchaseOrders.forEach((purchaseOrder) => {
    const row = document.createElement("tr");

    const id = getPurchaseOrderId(purchaseOrder);
    const supplier = getSupplierName(purchaseOrder);
    const status = getStatus(purchaseOrder);
    const orderDate = getOrderDate(purchaseOrder);
    const totalAmount = getTotalAmount(purchaseOrder);

    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditPurchaseOrderModal(${id})" type="button">Edit</button>`
      : "";

    const statusBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openStatusModal(${id})" type="button">Status</button>`
      : "";

    const deleteBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="deletePurchaseOrder(${id})" type="button">Delete</button>`
      : "";

    row.innerHTML = `
      <td>${id}</td>
      <td>${supplier}</td>
      <td>${status}</td>
      <td>${orderDate}</td>
      <td>${totalAmount.toFixed(2)}</td>
      <td>${editBtn} ${statusBtn} ${deleteBtn}</td>
    `;

    tbody.appendChild(row);
  });
}

// ============================================================
// LOAD ALL PURCHASE ORDERS
// ============================================================

async function getAllPurchaseOrders() {
  if (!signedIn) {
    showStatus("Please sign in to view purchase orders.", "error");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/GetPurchaseOrders`);

    if (response.status === 404) {
      currentPurchaseOrders = [];
      renderPurchaseOrders([]);
      showStatus("There are no purchase orders yet.", "info");
      return;
    }

    await checkResponse(response, "load purchase orders");

    const result = await response.json();

    currentPurchaseOrders = Array.isArray(result) ? result : [];

    renderPurchaseOrders(currentPurchaseOrders);
    clearStatus();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

// ============================================================
// ADD PURCHASE ORDER
// ============================================================

document
  .getElementById("addPurchaseOrderBtn")
  ?.addEventListener("click", () => {
    editingPurchaseOrderId = null;

    document.getElementById("purchaseOrderModalTitle").textContent =
      "Add Purchase Order";

    document.getElementById("purchaseOrderSupplierId").value = "";

    document.getElementById("purchaseOrderStatusSelect").value = "Pending";

    document.getElementById("purchaseOrderDate").value = "";

    document.getElementById("purchaseOrderTotalAmount").value = "";

    new bootstrap.Modal(document.getElementById("purchaseOrderModal")).show();
  });

// ============================================================
// EDIT PURCHASE ORDER
// ============================================================

function openEditPurchaseOrderModal(id) {
  const po = currentPurchaseOrders.find((p) => getPurchaseOrderId(p) === id);

  if (!po) return;

  editingPurchaseOrderId = id;

  document.getElementById("purchaseOrderModalTitle").textContent =
    "Edit Purchase Order";

  document.getElementById("purchaseOrderSupplierId").value =
    po.supplierId ?? po.SupplierId ?? "";

  document.getElementById("purchaseOrderStatusSelect").value = getStatus(po);

  document.getElementById("purchaseOrderDate").value = (
    getOrderDate(po) || ""
  ).split("T")[0];

  document.getElementById("purchaseOrderTotalAmount").value =
    getTotalAmount(po);

  new bootstrap.Modal(document.getElementById("purchaseOrderModal")).show();
}

// ============================================================
// SAVE PURCHASE ORDER
// ============================================================

document
  .getElementById("savePurchaseOrderBtn")
  ?.addEventListener("click", async () => {
    const supplierId = document.getElementById("purchaseOrderSupplierId").value;

    const status = document.getElementById("purchaseOrderStatusSelect").value;

    const orderDate = document.getElementById("purchaseOrderDate").value;

    const totalAmount = document.getElementById(
      "purchaseOrderTotalAmount",
    ).value;

    // User ID comes automatically from the JWT token
    const userId = currentUserId();

    if (!userId) {
      showStatus(
        "Could not identify the current user. Please sign in again.",
        "error",
      );
      return;
    }

    if (!supplierId || Number(supplierId) <= 0) {
      showStatus("Please enter a valid supplier ID.", "error");
      return;
    }

    if (!orderDate) {
      showStatus("Please select an order date.", "error");
      return;
    }

    if (totalAmount === "" || Number(totalAmount) < 0) {
      showStatus("Please enter a valid total amount.", "error");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    try {
      let response;

      // CREATE
      if (editingPurchaseOrderId === null) {
        response = await fetch(`${API_BASE}/AddPurchaseOrder`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            SupplierId: parseInt(supplierId, 10),

            UserId: userId,

            Status: status,

            OrderDate: orderDate,

            TotalAmount: parseFloat(totalAmount),
          }),
        });
      }

      // FULL UPDATE
      else {
        const params = new URLSearchParams({
          id: editingPurchaseOrderId,
          status,
          totalAmount,
          orderDate,
          supplierId,
          userId,
        });

        response = await fetch(
          `${API_BASE}/UpdatePurchaseOrder?${params.toString()}`,
          {
            method: "PUT",

            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }

      await checkResponse(
        response,
        editingPurchaseOrderId === null
          ? "add purchase order"
          : "update purchase order",
      );

      bootstrap.Modal.getInstance(
        document.getElementById("purchaseOrderModal"),
      ).hide();

      await getAllPurchaseOrders();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

// ============================================================
// UPDATE STATUS
// ============================================================

function openStatusModal(id) {
  const po = currentPurchaseOrders.find((p) => getPurchaseOrderId(p) === id);

  if (!po) return;

  editingPurchaseOrderId = id;

  document.getElementById("newStatusInput").value = getStatus(po);

  new bootstrap.Modal(document.getElementById("statusModal")).show();
}

document
  .getElementById("saveStatusBtn")
  ?.addEventListener("click", async () => {
    const newStatus = document.getElementById("newStatusInput").value;

    const token = localStorage.getItem(TOKEN_KEY);

    try {
      const response = await fetch(
        `${API_BASE}/UpdatePurchaseOrderStatus?id=${editingPurchaseOrderId}&status=${encodeURIComponent(
          newStatus,
        )}`,
        {
          method: "PATCH",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      await checkResponse(response, "update status");

      bootstrap.Modal.getInstance(
        document.getElementById("statusModal"),
      ).hide();

      await getAllPurchaseOrders();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

// ============================================================
// DELETE
// ============================================================

async function deletePurchaseOrder(id) {
  if (!confirm("Remove this purchase order? This can't be undone.")) {
    return;
  }

  const token = localStorage.getItem(TOKEN_KEY);

  try {
    const response = await fetch(`${API_BASE}/DeletePurchaseOrder?id=${id}`, {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await checkResponse(response, "delete purchase order");

    await getAllPurchaseOrders();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

// ============================================================
// FILTER
// ============================================================

document
  .getElementById("applyFilterBtn")
  ?.addEventListener("click", async () => {
    if (!signedIn) {
      showStatus("Please sign in to filter purchase orders.", "error");

      return;
    }

    const status = document.getElementById("statusFilter").value;

    const from = document.getElementById("fromDateFilter").value;

    const to = document.getElementById("toDateFilter").value;

    if (from && to && from > to) {
      showStatus(
        "The 'From' date cannot be later than the 'To' date.",
        "error",
      );

      return;
    }

    const params = new URLSearchParams();

    if (status) {
      params.append("status", status);
    }

    if (from) {
      params.append("from", from);
    }

    if (to) {
      params.append("to", to);
    }

    try {
      const response = await fetch(
        `${API_BASE}/FilterPurchaseOrders?${params.toString()}`,
      );

      if (response.status === 404) {
        currentPurchaseOrders = [];

        renderPurchaseOrders([]);

        showStatus("No purchase orders match the selected filters.", "info");

        return;
      }

      await checkResponse(response, "filter purchase orders");

      const result = await response.json();

      currentPurchaseOrders = Array.isArray(result) ? result : [];

      renderPurchaseOrders(currentPurchaseOrders);

      if (currentPurchaseOrders.length === 0) {
        showStatus("No purchase orders match the selected filters.", "info");
      } else {
        clearStatus();
      }
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

// ============================================================
// CLEAR FILTER
// ============================================================

document
  .getElementById("clearFilterBtn")
  ?.addEventListener("click", async () => {
    document.getElementById("statusFilter").value = "";

    document.getElementById("fromDateFilter").value = "";

    document.getElementById("toDateFilter").value = "";

    await getAllPurchaseOrders();
  });

// ============================================================
// SORT
// ============================================================

document
  .getElementById("sortPurchaseOrdersBtn")
  ?.addEventListener("click", () => {
    if (!signedIn) {
      showStatus("Please sign in to sort purchase orders.", "error");

      return;
    }

    if (currentPurchaseOrders.length === 0) {
      showStatus("There are no purchase orders to sort.", "info");

      return;
    }

    currentPurchaseOrders.sort((a, b) => {
      const totalA = getTotalAmount(a);

      const totalB = getTotalAmount(b);

      return sortDescending ? totalB - totalA : totalA - totalB;
    });

    sortDescending = !sortDescending;

    document.getElementById("sortPurchaseOrdersBtn").textContent =
      sortDescending ? "Sort by Total" : "Sort by Total (Ascending)";

    renderPurchaseOrders(currentPurchaseOrders);

    clearStatus();
  });

// ============================================================
// TOTAL PURCHASE VALUE PER SUPPLIER
// ============================================================

document
  .getElementById("supplierTotalsBtn")
  ?.addEventListener("click", async () => {
    if (!signedIn) {
      showStatus(
        "Please sign in to view purchase totals by supplier.",
        "error",
      );

      return;
    }

    try {
      const response = await fetch(`${API_BASE}/TotalPurchaseValuePerSupplier`);

      if (response.status === 404) {
        showStatus("No supplier purchase totals were found.", "info");

        return;
      }

      await checkResponse(response, "load supplier purchase totals");

      const result = await response.json();

      renderSupplierTotals(result);

      showStatus("Purchase totals by supplier loaded successfully.", "info");
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

// ============================================================
// RENDER SUPPLIER TOTALS
// ============================================================

function renderSupplierTotals(data) {
  const tbody = document.getElementById("purchaseOrdersTableBody");

  tbody.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">
          No supplier purchase totals found.
        </td>
      </tr>
    `;

    return;
  }

  data.forEach((item) => {
    const row = document.createElement("tr");

    const supplierId = item.supplierId ?? item.SupplierId ?? "-";

    const supplierName = item.supplierName ?? item.SupplierName ?? "-";

    const total = Number(
      item.totalPurchaseValue ?? item.TotalPurchaseValue ?? 0,
    );

    row.innerHTML = `
      <td>${supplierId}</td>
      <td>${supplierName}</td>
      <td>All Orders</td>
      <td>-</td>
      <td>${total.toFixed(2)}</td>
      <td>-</td>
    `;

    tbody.appendChild(row);
  });
}

// ============================================================
// LOGOUT
// ============================================================

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);

  window.location.reload();
});

// ============================================================
// ENTRY POINT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();

  if (!signedIn) {
    showStatus("Please sign in to view purchase orders.", "error");

    return;
  }

  await getAllPurchaseOrders();
});
