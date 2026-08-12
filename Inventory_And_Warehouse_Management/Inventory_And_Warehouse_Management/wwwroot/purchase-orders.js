const PO_ENDPOINTS = {
  list: "/PurchaseOrder/GetPurchaseOrders",
  add: "/PurchaseOrder/AddPurchaseOrder",
  update: "/PurchaseOrder/UpdatePurchaseOrder",
  delete: "/PurchaseOrder/DeletePurchaseOrder",
};

const poTableBody = document.getElementById("poTableBody");
const poForm = document.getElementById("poForm");
const poModalEl = document.getElementById("poModal");
const poModal = new bootstrap.Modal(poModalEl);
const poModalLabel = document.getElementById("poModalLabel");
const poAlert = document.getElementById("poAlert");
const poIdInput = document.getElementById("poId");

let cachedOrders = [];

document.addEventListener("DOMContentLoaded", loadPurchaseOrders);
document
  .getElementById("openAddBtn")
  .addEventListener("click", () => openForm());
poForm.addEventListener("submit", handleSave);

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function showAlert(message, type = "danger") {
  poAlert.textContent = message;
  poAlert.className = `alert-box alert-box-${type}`;
  poAlert.classList.remove("hidden");
}

function hideAlert() {
  poAlert.classList.add("hidden");
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

// ---------------- LIST ----------------

async function loadPurchaseOrders() {
  if (!getToken()) {
    poTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Please <a href="../Register/login.html">sign in</a> to view purchase orders.</td></tr>`;
    return;
  }

  try {
    const res = await fetch(PO_ENDPOINTS.list, { headers: authHeaders() });

    if (res.status === 401) {
      poTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Session expired. Please <a href="../Register/login.html">sign in</a> again.</td></tr>`;
      return;
    }

    if (!res.ok) throw new Error("Failed to load purchase orders.");

    cachedOrders = await res.json();
    renderTable(cachedOrders);
  } catch (err) {
    console.error(err);
    poTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">Could not load purchase orders. Try again later.</td></tr>`;
  }
}

function renderTable(orders) {
  if (!orders || orders.length === 0) {
    poTableBody.innerHTML = `<tr><td colspan="6" class="empty-row">No purchase orders yet. Create the first one.</td></tr>`;
    return;
  }

  poTableBody.innerHTML = orders
    .map((order, index) => {
      // NOTE: PurchaseOrderId currently has [JsonIgnore] on the backend model,
      // so `order.purchaseOrderId` will be undefined until that's removed.
      // Edit/Delete are wired against it and will start working automatically
      // the moment the backend exposes it — no frontend changes needed then.
      const id = order.purchaseOrderId;
      const dateLabel = order.orderDate
        ? new Date(order.orderDate).toLocaleDateString()
        : "—";
      const statusClass = (order.status || "").toLowerCase();

      return `
        <tr>
          <td>${dateLabel}</td>
          <td><span class="status-badge status-${statusClass}">${order.status ?? "—"}</span></td>
          <td>${formatCurrency(order.totalAmount)}</td>
          <td>${order.supplierId ?? "—"}</td>
          <td>${order.userId ?? "—"}</td>
          <td class="text-end">
            <button class="btn btn-outline btn-sm" data-action="edit" data-index="${index}">Edit</button>
            <button class="btn btn-ghost btn-sm btn-danger-text" data-action="delete" data-index="${index}">Delete</button>
          </td>
        </tr>`;
    })
    .join("");

  poTableBody
    .querySelectorAll('[data-action="edit"]')
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        openForm(cachedOrders[btn.dataset.index]),
      ),
    );
  poTableBody
    .querySelectorAll('[data-action="delete"]')
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        handleDelete(cachedOrders[btn.dataset.index]),
      ),
    );
}

// ---------------- CREATE / EDIT ----------------

function openForm(order = null) {
  hideAlert();
  poForm.reset();

  if (order) {
    poModalLabel.textContent = "Edit Purchase Order";
    poIdInput.value = order.purchaseOrderId ?? "";
    document.getElementById("poStatus").value = order.status ?? "Pending";
    document.getElementById("poOrderDate").value = order.orderDate
      ? order.orderDate.split("T")[0]
      : "";
    document.getElementById("poTotalAmount").value = order.totalAmount ?? "";
    document.getElementById("poSupplierId").value = order.supplierId ?? "";
    document.getElementById("poUserId").value = order.userId ?? "";
  } else {
    poModalLabel.textContent = "New Purchase Order";
    poIdInput.value = "";
  }

  poModal.show();
}

async function handleSave(e) {
  e.preventDefault();
  hideAlert();

  const id = poIdInput.value;
  const status = document.getElementById("poStatus").value;
  const orderDate = document.getElementById("poOrderDate").value;
  const totalAmount = parseFloat(
    document.getElementById("poTotalAmount").value,
  );
  const supplierId = parseInt(
    document.getElementById("poSupplierId").value,
    10,
  );
  const userId = parseInt(document.getElementById("poUserId").value, 10);

  try {
    let res;

    if (id) {
      if (!id) {
        showAlert(
          "This order cannot be edited yet — its ID is not returned by the API.",
        );
        return;
      }
      // UpdatePurchaseOrder reads plain query-string parameters, not a JSON body.
      const params = new URLSearchParams({
        id,
        status,
        totalAmount,
        orderDate,
        supplierId,
        userId,
      });
      res = await fetch(`${PO_ENDPOINTS.update}?${params.toString()}`, {
        method: "PUT",
        headers: authHeaders(),
      });
    } else {
      res = await fetch(PO_ENDPOINTS.add, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          status,
          orderDate,
          totalAmount,
          supplierId,
          userId,
        }),
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Could not save the purchase order.");
    }

    poModal.hide();
    loadPurchaseOrders();
  } catch (err) {
    showAlert(err.message);
  }
}

// ---------------- DELETE ----------------

async function handleDelete(order) {
  const id = order?.purchaseOrderId;

  if (!id) {
    showAlert(
      "This order cannot be deleted yet — its ID is not returned by the API.",
    );
    return;
  }

  if (!confirm("Delete this purchase order? This cannot be undone.")) return;

  try {
    const res = await fetch(`${PO_ENDPOINTS.delete}?id=${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || "Could not delete the purchase order.");
    }

    loadPurchaseOrders();
  } catch (err) {
    showAlert(err.message);
  }
}
