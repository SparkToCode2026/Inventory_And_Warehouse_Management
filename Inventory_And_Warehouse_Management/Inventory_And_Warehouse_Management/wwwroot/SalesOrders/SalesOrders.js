const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('salesOrderForm');
  const formCard = document.getElementById('orderFormCard');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveOrderBtn');
  const statusBanner = document.getElementById('statusBanner');
  const ordersContainer = document.getElementById('ordersContainer');

  const customerIdInput = document.getElementById('customerId');
  const userIdInput = document.getElementById('userId');
  const orderDateInput = document.getElementById('orderDate');
  const totalAmountInput = document.getElementById('totalAmount');
  const statusInput = document.getElementById('orderStatus');

  let editingId = null;
  let currentOrders = [];

  function showStatus(message, type = 'info') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
    statusBanner.style.display = 'block';
    statusBanner.hidden = false;
  }

  function clearStatus() {
    statusBanner.textContent = '';
    statusBanner.style.display = 'none';
    statusBanner.hidden = true;
  }

  async function apiRequest(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) throw new Error('Not authorized.');

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
    return body;
  }

  // ---- ID lookup (SalesOrderId is hidden via [JsonIgnore], so we find it manually) ----

  // Rounds the date down to the minute so small formatting differences don't break the match
  function minuteKey(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  }

  // Checks if two orders are "the same" by comparing their fields
  function ordersMatch(a, b) {
    const aCust = a.CustomerId ?? a.customerId;
    const bCust = b.CustomerId ?? b.customerId;
    const aUser = a.UserId ?? a.userId;
    const bUser = b.UserId ?? b.userId;
    const aTotal = a.TotalAmount ?? a.totalAmount;
    const bTotal = b.TotalAmount ?? b.totalAmount;
    const aStatus = (a.Status ?? a.status ?? '').toString().toLowerCase();
    const bStatus = (b.Status ?? b.status ?? '').toString().toLowerCase();
    const aDate = minuteKey(a.OrderDate ?? a.orderDate);
    const bDate = minuteKey(b.OrderDate ?? b.orderDate);

    return (
      Number(aCust) === Number(bCust) &&
      Number(aUser) === Number(bUser) &&
      Number(aTotal) === Number(bTotal) &&
      aStatus === bStatus &&
      aDate === bDate
    );
  }

  // Tries IDs 1 to maxId until it finds the order that matches
  async function findSalesOrderId(order, maxId = 200) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    for (let id = 1; id <= maxId; id++) {
      const res = await fetch(`${API_BASE}/SalesOrder/GetSalesOrder?id=${id}`, { headers });
      if (res.status === 404 || !res.ok) continue;
      const candidate = await res.json();
      if (ordersMatch(candidate, order)) return id;
    }
    return null;
  }

  async function loadOrders() {
    clearStatus();

    try {
      const orders = await apiRequest(`${API_BASE}/SalesOrder/GetALLSalesOrders`);

      // Find the real ID for each order before displaying
      for (const order of orders) {
        order.realId = await findSalesOrderId(order);
      }

      currentOrders = orders;
      displayOrders(orders);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  }

  function displayOrders(orders) {
    ordersContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
      ordersContainer.innerHTML = `<div class="empty-orders">No sales orders found.</div>`;
      return;
    }

    orders.forEach(order => {
      const orderId = order.realId;
      const disabled = orderId === null ? 'disabled' : ''; // no ID found = can't edit/delete safely

      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <h3>Sales Order ${orderId !== null ? '#' + orderId : '(unresolved)'}</h3>
        <div class="order-info">
          <div><strong>Customer ID:</strong> ${order.CustomerId ?? order.customerId ?? 0}</div>
          <div><strong>User ID:</strong> ${order.UserId ?? order.userId ?? 0}</div>
          <div><strong>Order Date:</strong> ${order.OrderDate || order.orderDate ? new Date(order.OrderDate || order.orderDate).toLocaleString() : ''}</div>
          <div><strong>Total Amount:</strong> $${Number(order.TotalAmount ?? order.totalAmount ?? 0).toFixed(2)}</div>
          <div><strong>Status:</strong> <span class="order-status">${order.Status || order.status || ''}</span></div>
        </div>
        <div class="order-actions">
          <button class="btn btn-outline" onclick="editOrder(${orderId})" ${disabled}>Edit</button>
          <button class="btn btn-outline" onclick="updateOrderStatus(${orderId})" ${disabled}>Update Status</button>
          <button class="btn btn-outline" onclick="deleteOrder(${orderId})" ${disabled}>Delete</button>
        </div>
      `;
      ordersContainer.appendChild(card);
    });
  }

  document.getElementById('addOrderBtn').addEventListener('click', () => {
    editingId = null;
    form.reset();
    formTitle.textContent = 'Add Sales Order';
    saveBtn.textContent = 'Create Order';
    formCard.hidden = false;
    clearStatus();
  });

  document.getElementById('cancelOrderBtn').addEventListener('click', () => {
    form.reset();
    formCard.hidden = true;
    clearStatus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();
    const currentId = editingId || 0;
    const payload = {
      SalesOrderId: currentId,
      id: currentId,
      CustomerId: Number(customerIdInput.value),
      UserId: Number(userIdInput.value),
      OrderDate: new Date(orderDateInput.value).toISOString(),
      TotalAmount: Number(totalAmountInput.value),
      Status: statusInput.value
    };

    try {
      saveBtn.disabled = true;
      if (editingId === null) {
        await apiRequest(`${API_BASE}/SalesOrder/AddSalesOrder`, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiRequest(`${API_BASE}/SalesOrder/UpdateSalesOrder?id=${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      form.reset();
      formCard.hidden = true;
      loadOrders();
    } catch (err) {
      showStatus("Check database primary keys or credentials.", 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  window.editOrder = async function (id) {
    if (!id) { showStatus("Could not find this order's ID.", 'error'); return; }
    try {
      clearStatus();
      const order = await apiRequest(`${API_BASE}/SalesOrder/GetSalesOrder?id=${id}`);
      editingId = id;
      customerIdInput.value = order.CustomerId ?? order.customerId;
      userIdInput.value = order.UserId ?? order.userId;
      totalAmountInput.value = order.TotalAmount ?? order.totalAmount;
      statusInput.value = order.Status ?? order.status;
      formTitle.textContent = 'Edit Sales Order';
      saveBtn.textContent = 'Update Order';
      formCard.hidden = false;
    } catch (err) {
      showStatus("Error loading item details.", 'error');
    }
  };

  window.updateOrderStatus = async function (id) {
    if (!id) { showStatus("Could not find this order's ID.", 'error'); return; }
    const newStatus = prompt('Enter status (Pending, Shipped, Delivered):');
    if (!newStatus) return;

    try {
      clearStatus();
      await apiRequest(
        `${API_BASE}/SalesOrder/UpdateStatus?id=${id}&status=${encodeURIComponent(newStatus)}`,
        { method: 'PATCH' }
      );
      await loadOrders();
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  };

  window.deleteOrder = function (id) {
    if (!id) { showStatus("Could not find this order's ID.", 'error'); return; }

    const modalEl = document.getElementById('deleteConfirmModal');
    const modal = new bootstrap.Modal(modalEl);
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      modal.hide();
      try {
        clearStatus();
        await apiRequest(`${API_BASE}/SalesOrder/RemoveSalesOrder?id=${id}`, { method: 'DELETE' });
        loadOrders();
      } catch (err) {
        showStatus("Error removing order.", 'error');
      }
    });

    modal.show();
  };

  document.getElementById('sortBtn').addEventListener('click', async () => {
    try {
      clearStatus();
      const orders = await apiRequest(`${API_BASE}/SalesOrder/SortByTotalAmount`);
      for (const order of orders) {
        order.realId = await findSalesOrderId(order);
      }
      currentOrders = orders;
      displayOrders(orders);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  });

  document.getElementById('filterBtn').addEventListener('click', () => {
    const wanted = document.getElementById('statusFilter').value.trim().toLowerCase();
    if (!wanted) { showStatus('Type a status first (Pending, Shipped, or Delivered).', 'info'); return; }

    const filtered = currentOrders.filter(o => (o.Status ?? o.status ?? '').toLowerCase() === wanted);
    if (filtered.length === 0) {
      ordersContainer.innerHTML = `<div class="empty-orders">No orders with that status.</div>`;
    } else {
      displayOrders(filtered);
    }
  });

  document.getElementById('showAllBtn').addEventListener('click', () => {
    document.getElementById('statusFilter').value = '';
    loadOrders();
  });

  // Run on start
  loadOrders();
});