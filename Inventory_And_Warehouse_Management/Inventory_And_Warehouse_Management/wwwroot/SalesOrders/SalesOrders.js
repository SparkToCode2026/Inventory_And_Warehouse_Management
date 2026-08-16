const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('salesOrderForm');
  const formCard = document.getElementById('orderFormCard');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveOrderBtn');
  const statusBanner = document.getElementById('statusBanner');
  const ordersContainer = document.getElementById('ordersContainer');
  const siteNav = document.getElementById('siteNav');

  const signedIn = Boolean(localStorage.getItem(TOKEN_KEY));

  document.getElementById('signedOutNotice')?.classList.toggle('hidden', signedIn);
  document.getElementById('pageContent')?.classList.toggle('hidden', !signedIn);

  if (signedIn) {
    siteNav.innerHTML = `
      <button type="button" class="btn btn-ghost" id="signOutBtn">
        Sign Out
      </button>
    `;

    document.getElementById('signOutBtn').addEventListener('click', () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '../index.html';
    });
  } else {
    siteNav.innerHTML = `
      <a href="../Register/login.html" class="btn btn-ghost">
        Sign In
      </a>
    `;

    return;
  }

// Decodes the JWT payload so we can read claims out of it (no verification needed client-side)
  function decodeJwt(token) {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  // Pull the logged-in user's own ID out of the token's "sub" claim
  function currentUserId() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const claims = decodeJwt(token);
    if (!claims) return null;
    return claims.sub
      ?? claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
      ?? null;
  }

  const customerIdInput = document.getElementById('customerId');
  const userIdInput = document.getElementById('userId');
  userIdInput.readOnly = true;
  userIdInput.title = "Auto-filled from your login - can't be changed manually";
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

  // ---- ID access ----
  function realIdOf(order) {
    return order.SalesOrderId ?? order.salesOrderId ?? null;
  }

  async function loadOrders() {
    clearStatus();

    try {
      const orders = await apiRequest(`${API_BASE}/SalesOrder/GetALLSalesOrders`);

      orders.forEach(order => { order.realId = realIdOf(order); });

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
      const disabled = orderId === null ? 'disabled' : ''; // no ID = can't edit/delete safely

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

    // Auto-fill User ID from the logged-in user's own token instead of asking them to type it
    const myId = currentUserId();
    if (myId !== null) userIdInput.value = myId;
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
      showStatus(err.message, 'error');
      console.error(err);
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
      orders.forEach(order => { order.realId = realIdOf(order); });
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

  document.getElementById('totalPerCustomerBtn').addEventListener('click', async () => {
    try {
      clearStatus();
      const results = await apiRequest(`${API_BASE}/SalesOrder/TotalSalesValuePerCustomer`);
      if (!results.length) {
        ordersContainer.innerHTML = `<div class="empty-orders">No data yet.</div>`;
        return;
      }
      ordersContainer.innerHTML = results.map(r => {
        const custId = r.CustomerId ?? r.customerId;
        const total = r.TotalSalesValue ?? r.totalSalesValue ?? 0;
        return `
          <div class="order-card">
            <h3>Customer #${custId}</h3>
            <div class="order-info">
              <div><strong>Total Sales:</strong> $${Number(total).toFixed(2)}</div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  });

  // Run on start
  loadOrders();
});