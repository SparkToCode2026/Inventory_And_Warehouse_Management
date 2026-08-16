const API_BASE = "https://localhost:7111/PurchaseOrderItem";

let currentPurchaseOrderItems = [];
let signedIn = false;
let sortDescending = true;
let editingItemId = null;

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

  document
    .getElementById("signedOutNotice")
    ?.classList.toggle("hidden", signedIn);

  document.getElementById("pageContent")?.classList.toggle("hidden", !signedIn);

  document.getElementById("logoutBtn")?.classList.toggle("hidden", !signedIn);

  document.getElementById("signInLink")?.classList.toggle("hidden", signedIn);

  document.getElementById("addItemBtn")?.classList.toggle("hidden", !signedIn);

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
  document.getElementById("statusBanner")?.classList.add("hidden");
}

function getFriendlyErrorMessage(status, action) {
  switch (status) {
    case 401:
      return "You are not signed in or your session has expired. Please sign in and try again.";

    case 403:
      return "You do not have permission to perform this action.";

    case 404:
      return "The requested purchase order item was not found.";

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

function getItemId(item) {
  return item.purchaseOrderItemId ?? item.PurchaseOrderItemId ?? "-";
}

function getPurchaseOrderId(item) {
  return item.purchaseOrderId ?? item.PurchaseOrderId ?? "-";
}

function getProductId(item) {
  return item.productId ?? item.ProductId ?? "-";
}

function getProductName(item) {
  return (
    item.product?.name ||
    item.Product?.Name ||
    item.productName ||
    item.ProductName ||
    "-"
  );
}

function getQuantity(item) {
  return Number(item.quantity ?? item.Quantity ?? 0);
}

function getUnitPrice(item) {
  return Number(item.unitPrice ?? item.UnitPrice ?? 0);
}

function getTotalPrice(item) {
  return Number(item.totalPrice ?? item.TotalPrice ?? 0);
}

function renderPurchaseOrderItems(items) {
  const tbody = document.getElementById("purchaseOrderItemsTableBody");

  tbody.innerHTML = "";

  if (!items || items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No purchase order items found.
        </td>
      </tr>
    `;

    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");

    const id = getItemId(item);

    const editBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openEditItemModal(${id})" type="button">Edit</button>`
      : "";
    const qtyBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="openQuantityModal(${id})" type="button">Quantity</button>`
      : "";
    const deleteBtn = signedIn
      ? `<button class="btn btn-outline btn-sm" onclick="deleteItem(${id})" type="button">Delete</button>`
      : "";

    row.innerHTML = `
      <td>${id}</td>
      <td>${getPurchaseOrderId(item)}</td>
      <td>${getProductName(item)} (#${getProductId(item)})</td>
      <td>${getQuantity(item)}</td>
      <td>${getUnitPrice(item).toFixed(2)}</td>
      <td>${getTotalPrice(item).toFixed(2)}</td>
      <td>${editBtn} ${qtyBtn} ${deleteBtn}</td>
    `;

    tbody.appendChild(row);
  });
}

async function getAllPurchaseOrderItems() {
  if (!signedIn) {
    showStatus("Please sign in to view purchase order items.", "error");

    return;
  }

  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/GetPurchaseOrderItems`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 404) {
      currentPurchaseOrderItems = [];

      renderPurchaseOrderItems([]);

      showStatus("There are no purchase order items yet.", "info");

      return;
    }

    await checkResponse(response, "load purchase order items");

    const result = await response.json();

    currentPurchaseOrderItems = Array.isArray(result) ? result : [];

    renderPurchaseOrderItems(currentPurchaseOrderItems);

    clearStatus();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

document.getElementById("addItemBtn")?.addEventListener("click", () => {
  editingItemId = null;
  document.getElementById("itemModalTitle").textContent = "Add Item";
  document.getElementById("itemPurchaseOrderId").value = "";
  document.getElementById("itemProductId").value = "";
  document.getElementById("itemQuantity").value = "";
  document.getElementById("itemUnitPrice").value = "";
  new bootstrap.Modal(document.getElementById("itemModal")).show();
});

function openEditItemModal(id) {
  const item = currentPurchaseOrderItems.find((i) => getItemId(i) === id);
  if (!item) return;

  editingItemId = id;
  document.getElementById("itemModalTitle").textContent = "Edit Item";
  document.getElementById("itemPurchaseOrderId").value =
    getPurchaseOrderId(item);
  document.getElementById("itemProductId").value = getProductId(item);
  document.getElementById("itemQuantity").value = getQuantity(item);
  document.getElementById("itemUnitPrice").value = getUnitPrice(item);

  new bootstrap.Modal(document.getElementById("itemModal")).show();
}

document.getElementById("saveItemBtn")?.addEventListener("click", async () => {
  const purchaseOrderId = document.getElementById("itemPurchaseOrderId").value;
  const productId = document.getElementById("itemProductId").value;
  const quantity = document.getElementById("itemQuantity").value;
  const unitPrice = document.getElementById("itemUnitPrice").value;

  if (!purchaseOrderId || !productId || !quantity || unitPrice === "") {
    showStatus("Please fill in all fields.", "error");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    let response;

    if (editingItemId === null) {
      response = await fetch(`${API_BASE}/AddPurchaseOrderItem`, {
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
      });
    } else {
      const params = new URLSearchParams({
        id: editingItemId,
        purchaseOrderId,
        productId,
        quantity,
        unitPrice,
      });

      response = await fetch(
        `${API_BASE}/UpdatePurchaseOrderItem?${params.toString()}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    }

    await checkResponse(
      response,
      editingItemId === null ? "add item" : "update item",
    );

    bootstrap.Modal.getInstance(document.getElementById("itemModal")).hide();
    await getAllPurchaseOrderItems();
  } catch (error) {
    showStatus(error.message, "error");
  }
});

function openQuantityModal(id) {
  const item = currentPurchaseOrderItems.find((i) => getItemId(i) === id);
  if (!item) return;

  editingItemId = id;
  document.getElementById("newQuantityInput").value = getQuantity(item);
  new bootstrap.Modal(document.getElementById("quantityModal")).show();
}

document
  .getElementById("saveQuantityBtn")
  ?.addEventListener("click", async () => {
    const newQuantity = document.getElementById("newQuantityInput").value;

    if (!newQuantity || Number(newQuantity) <= 0) {
      showStatus("Please enter a valid quantity.", "error");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${API_BASE}/UpdatePurchaseOrderItemQuantity?id=${editingItemId}&quantity=${newQuantity}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
      );

      await checkResponse(response, "update quantity");

      bootstrap.Modal.getInstance(
        document.getElementById("quantityModal"),
      ).hide();
      await getAllPurchaseOrderItems();
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

async function deleteItem(id) {
  if (!confirm("Remove this item? This can't be undone.")) return;

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(
      `${API_BASE}/DeletePurchaseOrderItem?id=${id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    await checkResponse(response, "delete item");
    await getAllPurchaseOrderItems();
  } catch (error) {
    showStatus(error.message, "error");
  }
}

async function filterPurchaseOrderItems() {
  if (!signedIn) {
    showStatus("Please sign in to filter purchase order items.", "error");

    return;
  }

  const productId = document.getElementById("productIdFilter").value.trim();

  if (!productId) {
    await getAllPurchaseOrderItems();
    return;
  }

  if (!Number.isInteger(Number(productId)) || Number(productId) <= 0) {
    showStatus("Please enter a valid product ID.", "error");

    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/PurchaseOrderItemsByProduct?productId=${encodeURIComponent(productId)}`,
    );

    if (response.status === 404) {
      currentPurchaseOrderItems = [];

      renderPurchaseOrderItems([]);

      showStatus(
        "No purchase order items were found for that product.",
        "info",
      );

      return;
    }

    await checkResponse(response, "filter purchase order items");

    const result = await response.json();

    currentPurchaseOrderItems = Array.isArray(result) ? result : [];

    renderPurchaseOrderItems(currentPurchaseOrderItems);

    if (currentPurchaseOrderItems.length === 0) {
      showStatus(
        "No purchase order items were found for that product.",
        "info",
      );
    } else {
      clearStatus();
    }
  } catch (error) {
    showStatus(error.message, "error");
  }
}

document
  .getElementById("applyFilterBtn")
  ?.addEventListener("click", filterPurchaseOrderItems);

document
  .getElementById("clearFilterBtn")
  ?.addEventListener("click", async () => {
    document.getElementById("productIdFilter").value = "";

    await getAllPurchaseOrderItems();
  });

document.getElementById("sortItemsBtn")?.addEventListener("click", () => {
  if (!signedIn) {
    showStatus("Please sign in to sort purchase order items.", "error");

    return;
  }

  if (currentPurchaseOrderItems.length === 0) {
    showStatus("There are no purchase order items to sort.", "info");

    return;
  }

  currentPurchaseOrderItems.sort((a, b) => {
    const quantityA = getQuantity(a);

    const quantityB = getQuantity(b);

    return sortDescending ? quantityB - quantityA : quantityA - quantityB;
  });

  sortDescending = !sortDescending;

  document.getElementById("sortItemsBtn").textContent = sortDescending
    ? "Sort by Quantity"
    : "Sort by Quantity (Ascending)";

  renderPurchaseOrderItems(currentPurchaseOrderItems);

  clearStatus();
});

document
  .getElementById("itemsByProductBtn")
  ?.addEventListener("click", filterPurchaseOrderItems);

document
  .getElementById("mostOrderedProductsBtn")
  ?.addEventListener("click", async () => {
    if (!signedIn) {
      showStatus("Please sign in to view the most ordered products.", "error");

      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/MostOrderedProducts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 404) {
        showStatus("No ordered products were found.", "info");

        return;
      }

      await checkResponse(response, "load most ordered products");

      const result = await response.json();

      renderMostOrderedProducts(result);

      showStatus("Most ordered products loaded successfully.", "info");
    } catch (error) {
      showStatus(error.message, "error");
    }
  });

function renderMostOrderedProducts(data) {
  const tbody = document.getElementById("purchaseOrderItemsTableBody");

  tbody.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">
          No ordered products found.
        </td>
      </tr>
    `;

    return;
  }

  data.forEach((item) => {
    const productId = item.productId ?? item.ProductId ?? "-";

    const productName = item.productName ?? item.ProductName ?? "-";

    const totalQuantity =
      item.totalQuantityOrdered ?? item.TotalQuantityOrdered ?? 0;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>-</td>
      <td>-</td>
      <td>${productName} (#${productId})</td>
      <td>${totalQuantity}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
    `;

    tbody.appendChild(row);
  });
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");

  window.location.reload();
});

document.addEventListener("DOMContentLoaded", async () => {
  checkAccess();

  if (!signedIn) {
    showStatus("Please sign in to view purchase order items.", "error");

    return;
  }

  await getAllPurchaseOrderItems();
});