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


  // ---------- Status Message ----------

  function showStatus(message, type = 'info') {
    statusBanner.textContent = message;
    statusBanner.className = `status-banner ${type}`;
    statusBanner.hidden = false;
  }

  function clearStatus() {
    statusBanner.hidden = true;
  }


  // ---------- API Helper ----------

  async function apiRequest(url, options = {}) {

    const token = localStorage.getItem(TOKEN_KEY);

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      throw new Error('You are not authorized. Please sign in again.');
    }

    const contentType = response.headers.get('content-type') || '';

    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new Error(
        typeof body === 'string'
          ? body
          : 'Request failed.'
      );
    }

    return body;
  }


  // ---------- Load All Sales Orders ----------

  async function loadOrders() {

    try {

      clearStatus();

      const orders = await apiRequest(
        `${API_BASE}/SalesOrder/GetALLSalesOrders`
      );

      displayOrders(orders);

    } catch (err) {

      showStatus(err.message, 'error');

    }
  }


  // ---------- Display Orders ----------

  function displayOrders(orders) {

    ordersContainer.innerHTML = '';

    if (!orders || orders.length === 0) {

      ordersContainer.innerHTML = `
        <div class="empty-orders">
          No sales orders found.
        </div>
      `;

      return;
    }


    orders.forEach(order => {

      const card = document.createElement('div');

      card.className = 'order-card';

      card.innerHTML = `
        <h3>Sales Order #${order.salesOrderId}</h3>

        <div class="order-info">

          <div>
            <strong>Customer ID:</strong>
            ${order.customerId}
          </div>

          <div>
            <strong>User ID:</strong>
            ${order.userId}
          </div>

          <div>
            <strong>Order Date:</strong>
            ${formatDate(order.orderDate)}
          </div>

          <div>
            <strong>Total Amount:</strong>
            ${order.totalAmount}
          </div>

          <div>
            <strong>Status:</strong>
            <span class="order-status">
              ${order.status}
            </span>
          </div>

        </div>

        <div class="order-actions">

          <button
            class="btn btn-outline"
            onclick="editOrder(${order.salesOrderId})">
            Edit
          </button>

          <button
            class="btn btn-outline"
            onclick="updateOrderStatus(${order.salesOrderId})">
            Update Status
          </button>

          <button
            class="btn btn-outline"
            onclick="deleteOrder(${order.salesOrderId})">
            Delete
          </button>

        </div>
      `;

      ordersContainer.appendChild(card);

    });
  }


  // ---------- Format Date ----------

  function formatDate(date) {

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleString();

  }


  // ---------- Open Add Form ----------

  document.getElementById('addOrderBtn').addEventListener('click', () => {

    editingId = null;

    form.reset();

    formTitle.textContent = 'Add Sales Order';
    saveBtn.textContent = 'Create Order';

    formCard.hidden = false;

    clearStatus();

  });


  // ---------- Cancel Form ----------

  document.getElementById('cancelOrderBtn').addEventListener('click', () => {

    form.reset();

    editingId = null;

    formCard.hidden = true;

    clearStatus();

  });


  // ---------- Create / Update ----------

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    clearStatus();

    const payload = {

      CustomerId: Number(customerIdInput.value),

      UserId: Number(userIdInput.value),

      OrderDate: new Date(orderDateInput.value).toISOString(),

      TotalAmount: Number(totalAmountInput.value),

      Status: statusInput.value

    };


    try {

      saveBtn.disabled = true;

      saveBtn.textContent = editingId
        ? 'Updating...'
        : 'Creating...';


      if (editingId === null) {

        // CREATE
        await apiRequest(
          `${API_BASE}/SalesOrder/AddSalesOrder`,
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );

        showStatus(
          'Sales Order created successfully.',
          'success'
        );

      } else {

        // UPDATE
        await apiRequest(
          `${API_BASE}/SalesOrder/UpdateSalesOrder?id=${editingId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload)
          }
        );

        showStatus(
          'Sales Order updated successfully.',
          'success'
        );

      }


      form.reset();

      editingId = null;

      formCard.hidden = true;

      await loadOrders();


    } catch (err) {

      showStatus(err.message, 'error');

    } finally {

      saveBtn.disabled = false;

      saveBtn.textContent = 'Create Order';

    }

  });


  // ---------- Edit Order ----------

  window.editOrder = async function (id) {

    try {

      const order = await apiRequest(
        `${API_BASE}/SalesOrder/GetSalesOrder?id=${id}`
      );


      editingId = id;

      customerIdInput.value = order.customerId;

      userIdInput.value = order.userId;

      totalAmountInput.value = order.totalAmount;

      statusInput.value = order.status;


      if (order.orderDate) {

        const date = new Date(order.orderDate);

        const localDate =
          date.getFullYear() +
          '-' +
          String(date.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date.getDate()).padStart(2, '0') +
          'T' +
          String(date.getHours()).padStart(2, '0') +
          ':' +
          String(date.getMinutes()).padStart(2, '0');

        orderDateInput.value = localDate;

      }


      formTitle.textContent = 'Edit Sales Order';

      saveBtn.textContent = 'Update Order';

      formCard.hidden = false;

      window.scrollTo({
        top: formCard.offsetTop - 20,
        behavior: 'smooth'
      });


    } catch (err) {

      showStatus(err.message, 'error');

    }

  };


  // ---------- Update Status ----------

  window.updateOrderStatus = async function (id) {

    const newStatus = prompt(
      'Enter new status: Pending, Shipped, or Delivered'
    );

    if (!newStatus) {
      return;
    }


    try {

      await apiRequest(
        `${API_BASE}/SalesOrder/UpdateStatus?id=${id}&status=${encodeURIComponent(newStatus)}`,
        {
          method: 'PATCH'
        }
      );


      showStatus(
        'Status updated successfully.',
        'success'
      );

      await loadOrders();


    } catch (err) {

      showStatus(err.message, 'error');

    }

  };


  // ---------- Delete Order ----------

  window.deleteOrder = async function (id) {

    const confirmed = confirm(
      `Are you sure you want to delete Sales Order #${id}?`
    );

    if (!confirmed) {
      return;
    }


    try {

      await apiRequest(
        `${API_BASE}/SalesOrder/RemoveSalesOrder?id=${id}`,
        {
          method: 'DELETE'
        }
      );


      showStatus(
        'Sales Order deleted successfully.',
        'success'
      );

      await loadOrders();


    } catch (err) {

      showStatus(err.message, 'error');

    }

  };


  // ---------- Filter by Status ----------

  document.getElementById('filterBtn').addEventListener('click', async () => {

    const status =
      document.getElementById('statusFilter').value.trim();

    if (!status) {

      showStatus(
        'Please enter a status.',
        'error'
      );

      return;
    }


    try {

      const orders = await apiRequest(
        `${API_BASE}/SalesOrder/FilterByStatus?status=${encodeURIComponent(status)}`
      );

      displayOrders(orders);

    } catch (err) {

      showStatus(err.message, 'error');

    }

  });


  // ---------- Show All ----------

  document.getElementById('showAllBtn').addEventListener('click', () => {

    document.getElementById('statusFilter').value = '';

    loadOrders();

  });


  // ---------- Sort by Total Amount ----------

  document.getElementById('sortBtn').addEventListener('click', async () => {

    try {

      const orders = await apiRequest(
        `${API_BASE}/SalesOrder/SortByTotalAmount`
      );

      displayOrders(orders);

    } catch (err) {

      showStatus(err.message, 'error');

    }

  });


  // ---------- Load Page ----------

  loadOrders();

});
