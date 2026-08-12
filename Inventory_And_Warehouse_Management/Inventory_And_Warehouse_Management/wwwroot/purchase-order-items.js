const POI_ENDPOINTS = {
  list: "/PurchaseOrderItem/GetPurchaseOrderItems",
  add: "/PurchaseOrderItem/AddPurchaseOrderItem",
  update: "/PurchaseOrderItem/UpdatePurchaseOrderItem",
  delete: "/PurchaseOrderItem/DeletePurchaseOrderItem",
};

const poiTableBody = document.getElementById("poiTableBody");
const poiForm = document.getElementById("poiForm");
const poiModalEl = document.getElementById("poiModal");
const poiModal = new bootstrap.Modal(poiModalEl);
const poiModalLabel = document.getElementById("poiModalLabel");
const poiAlert = document.getElementById("poiAlert");
const poiIdInput = document.getElementById("poiId");

let cachedItems = [];

document.addEventListener("DOMContentLoaded", loadItems);
document
  .getElementById("openAddBtn")
  .addEventListener("click", () => openForm());
poiForm.addEventListener("submit", handleSave);

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showAlert(message, type = "danger") {
  poiAlert.textContent = message;
  poiAlert.className = `alert-box alert-box-${type}`;
  poiAlert.classList.remove("hidden");
}

function hideAlert() {
  poiAlert.classList.add("hidden");
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// ---------------- LIST ----------------

async function loadItems() {
  if (!getToken()) {
    poiTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Please <a href="../Register/login.html">sign in</a> to view purchase order items.</td></tr>`;
    return;
  }

  try {
    const res = await fetch(POI_ENDPOINTS.list, { headers: authHeaders() });

    if (res.status === 401) {
      poiTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Session expired. Please <a href="../Register/login.html">sign in</a> again.</td></tr>`;
      return;
    }

    if (!res.ok) throw new Error("Failed to load purchase order items.");

    cachedItems = await res.json();
    renderTable(cachedItems);
  } catch (err) {
    console.error(err);
    poiTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Could not load purchase order items. Try again later.</td></tr>`;
  }
}

function renderTable(items) {
  if (!items || items.length === 0) {
    poiTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">No purchase order items yet. Add the first one.</td></tr>`;
    return;
  }

  poiTableBody.innerHTML = items
    .map((item, index) => {
      // NOTE: PurchaseOrderItemId currently has [JsonIgnore] on the backend model,
      // so `item.purchaseOrderItemId` will be undefined until that's removed.
      // Edit/Delete are wired against it and will start working automatically
      // the moment the backend exposes it — no frontend changes needed then.
      const id = item.purchaseOrderItemId;

      return `
        <tr>
          <td>${item.purchaseOrderId ?? "—"}</td>
          <td>${item.productId ?? "—"}</td>
          <td>${item.quantity ?? "—"}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(item.totalPrice)}</td>
          <td class="text-end">
            <button class="btn btn-outline btn-sm" data-action="edit" data-index="${index}">Edit</button>
            <button class="btn btn-ghost btn-sm btn-danger-text" data-action="delete" data-index="${index}">Delete</button>
          </td>
        </tr>`;
    })
    .join("");

  poiTableBody
    .querySelectorAll('[data-action="edit"]')
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        openForm(cachedItems[btn.dataset.index]),
      ),
    );
  poiTableBody
    .querySelectorAll('[data-action="delete"]')
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        handleDelete(cachedItems[btn.dataset.index]),
      ),
    );
}

// ---------------- CREATE / EDIT ----------------

function openForm(item = null) {
  hideAlert();
  poiForm.reset();

  if (item) {
    poiModalLabel.textContent = "Edit Purchase Order Item";
    poiIdInput.value = item.purchaseOrderItemId ?? "";
    document.getElementById("poiPurchaseOrderId").value =
      item.purchaseOrderId ?? "";
    document.getElementById("poiProductId").value = item.productId ?? "";
    document.getElementById("poiQuantity").value = item.quantity ?? "";
    document.getElementById("poiUnitPrice").value = item.unitPrice ?? "";
  } else {
    poiModalLabel.textContent = "New Purchase Order Item";
    poiIdInput.value = "";
  }

  poiModal.show();
}

async function handleSave(e) {
  e.preventDefault();
  hideAlert();

  const id = poiIdInput.value;
  const purchaseOrderId = parseInt(
    document.getElementById("poiPurchaseOrderId").value,
    10,
  );
  const productId = parseInt(document.getElementById("poiProductId").value, 10);
  const quantity = parseInt(document.getElementById("poiQuantity").value, 10);
  const unitPrice = parseFloat(document.getElementById("poiUnitPrice").value);

  try {
    let res;

    if (id) {
      // UpdatePurchaseOrderItem reads plain query-string parameters, not a JSON body.
      const params = new URLSearchParams({
        id,
        purchaseOrderId,
        productId,
        quantity,
        unitPrice,
      });
      res = await fetch(`${POI_ENDPOINTS.update}?${params.toString()}`, {
        method: "PUT",
        headers: authHeaders(),
      });
    } else {
      res = await fetch(POI_ENDPOINTS.add, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          purchaseOrderId,
          productId,
          quantity,
          unitPrice,
        }),
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Could not save the purchase order item.");
    }

    poiModal.hide();
    loadItems();
  } catch (err) {
    showAlert(err.message);
  }
}

// ---------------- DELETE ----------------

async function handleDelete(item) {
  const id = item?.purchaseOrderItemId;

  if (!id) {
    showAlert(
      "This item cannot be deleted yet — its ID is not returned by the API.",
    );
    return;
  }

  if (!confirm("Delete this purchase order item? This cannot be undone."))
    return;

  try {
    const res = await fetch(`${POI_ENDPOINTS.delete}?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Could not delete the purchase order item.");
    }

    loadItems();
  } catch (err) {
    showAlert(err.message);
  }
}
