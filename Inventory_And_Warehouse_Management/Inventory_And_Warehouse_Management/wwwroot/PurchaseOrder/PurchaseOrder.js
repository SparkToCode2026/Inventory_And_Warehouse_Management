const API_BASE = "https://localhost:7111/PurchaseOrder";

let currentPurchaseOrders = [];
let signedIn = false;
let sortDescending = true;

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

// ============================================================
// ACCESS
// ============================================================

function checkAccess() {
  const token = localStorage.getItem("token");
  const claims = token ? decodeJwt(token) : null;

  const role =
    claims?.role ||
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
    claims?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  signedIn = Boolean(token && claims);

  document.getElementById("logoutBtn")?.classList.toggle("hidden", !signedIn);

  document.getElementById("signInLink")?.classList.toggle("hidden", signedIn);

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
        <td colspan="5" class="text-center">
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

    row.innerHTML = `
      <td>${id}</td>
      <td>${supplier}</td>
      <td>${status}</td>
      <td>${orderDate}</td>
      <td>${totalAmount.toFixed(2)}</td>
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
        <td colspan="5" class="text-center">
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
    `;

    tbody.appendChild(row);
  });
}

// ============================================================
// LOGOUT
// ============================================================

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");

  window.location.reload();
});

// ============================================================
// ENTRY POINT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();

  /*
   * IMPORTANT:
   * Do not call the API when the user is not signed in.
   */

  if (!signedIn) {
    showStatus("Please sign in to view purchase orders.", "error");

    return;
  }

  await getAllPurchaseOrders();
});
