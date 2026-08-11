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

  async function loadOrders() {
    clearStatus();

    try {
        const orders = await apiRequest(
            `${API_BASE}/SalesOrder/GetALLSalesOrders`
        );

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
      const orderId = order.SalesOrderId || order.salesOrderId || order.id || 0;
      const card = document.createElement('div');
      card.className = 'order-card';
      card.innerHTML = `
        <h3>Sales Order #${orderId}</h3>
        <div class="order-info">
          <div><strong>Customer ID:</strong> ${order.CustomerId || order.customerId || 0}</div>
          <div><strong>User ID:</strong> ${order.UserId || order.userId || 0}</div>
          <div><strong>Order Date:</strong> ${order.OrderDate || order.orderDate ? new Date(order.OrderDate || order.orderDate).toLocaleString() : ''}</div>
          <div><strong>Total Amount:</strong> $${(order.TotalAmount || order.totalAmount || 0).toFixed(2)}</div>
          <div><strong>Status:</strong> <span class="order-status">${order.Status || order.status || ''}</span></div>
        </div>
        <div class="order-actions">
          <button class="btn btn-outline" onclick="editOrder(${orderId})">Edit</button>
          <button class="btn btn-outline" onclick="updateOrderStatus(${orderId})">Update Status</button>
          <button class="btn btn-outline" onclick="deleteOrder(${orderId})">Delete</button>
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
    try {
      clearStatus();
      const order = await apiRequest(`${API_BASE}/SalesOrder/GetSalesOrder?id=${id}`);
      editingId = id;
      customerIdInput.value = order.CustomerId || order.customerId;
      userIdInput.value = order.UserId || order.userId;
      totalAmountInput.value = order.TotalAmount || order.totalAmount;
      statusInput.value = order.Status || order.status;
      formTitle.textContent = 'Edit Sales Order';
      saveBtn.textContent = 'Update Order';
      formCard.hidden = false;
    } catch (err) {
      showStatus("Error loading item details.", 'error');
    }
  };

  window.updateOrderStatus = async function (id) {
    const newStatus = prompt(
        'Enter status (Pending, Shipped, Delivered):'
    );

    if (!newStatus) return;

    try {
        clearStatus();

        await apiRequest(
            `${API_BASE}/SalesOrder/UpdateStatus?id=${id}&status=${encodeURIComponent(newStatus)}`,
            {
                method: 'PATCH'
            }
        );

        await loadOrders();

    } catch (err) {
        showStatus(err.message, 'error');
        console.error(err);
    }
};

  window.deleteOrder = async function (id) {
    if (!confirm(`Delete Order #${id}?`)) return;
    try {
      clearStatus();
      await apiRequest(`${API_BASE}/SalesOrder/RemoveSalesOrder?id=${id}`, { method: 'DELETE' });
      loadOrders();
    } catch (err) {
      showStatus("Error removing order.", 'error');
    }
  };

  document.getElementById('sortBtn').addEventListener('click', async () => {
    try {
        clearStatus();

        const orders = await apiRequest(
            `${API_BASE}/SalesOrder/SortByTotalAmount`
        );

        displayOrders(orders);

    } catch (err) {
        showStatus(err.message, 'error');
        console.error(err);
    }
});

  document.getElementById('showAllBtn').addEventListener('click', () => {
    document.getElementById('statusFilter').value = '';
    loadOrders();
  });

  // Run on start
  loadOrders();
});