const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('salesOrderItemForm');
  const formCard = document.getElementById('itemFormCard');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveItemBtn');
  const statusBanner = document.getElementById('statusBanner');
  const itemsContainer = document.getElementById('itemsContainer');
  const siteNav = document.getElementById('siteNav');

  const signedIn = Boolean(localStorage.getItem(TOKEN_KEY));

  document.getElementById('signedOutNotice')?.classList.toggle('hidden', signedIn);
  document.getElementById('pageContent')?.classList.toggle('hidden', !signedIn);

  // Show Sign In or Sign Out depending on whether a token is saved
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

  const salesOrderIdInput = document.getElementById('salesOrderId');
  const productIdInput = document.getElementById('productId');
  const quantityInput = document.getElementById('quantity');
  const unitPriceInput = document.getElementById('unitPrice');

  let editingId = null;
  let currentItems = [];
  let productNameCache = {};
  let orderLabelCache = {};

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

  // Small helpers to read fields safely, whether the API sends PascalCase or camelCase
  function realIdOf(item) {
    return item.SalesOrderItemId ?? item.salesOrderItemId ?? null;
  }
  function salesOrderIdOf(item) {
    return item.SalesOrderId ?? item.salesOrderId ?? null;
  }
  function productIdOf(item) {
    return item.ProductId ?? item.productId ?? null;
  }
  function quantityOf(item) {
    return item.Quantity ?? item.quantity ?? 0;
  }
  function unitPriceOf(item) {
    return item.UnitPrice ?? item.unitPrice ?? 0;
  }
  function totalPriceOf(item) {
    return item.TotalPrice ?? item.totalPrice ?? 0;
  }

  // Looks up a product's name once, then remembers it so we don't ask the server again
  async function getProductName(productId) {
    if (productId === null) return 'Unknown product';
    if (productNameCache[productId]) return productNameCache[productId];
    try {
      const res = await fetch(`${API_BASE}/Product/GetProduct?id=${productId}`);
      if (!res.ok) return `Product #${productId}`;
      const product = await res.json();
      const name = product.Name ?? product.name ?? `Product #${productId}`;
      productNameCache[productId] = name;
      return name;
    } catch {
      return `Product #${productId}`;
    }
  }

  async function getOrderLabel(salesOrderId) {
    if (salesOrderId === null) return 'Unknown order';
    if (orderLabelCache[salesOrderId]) return orderLabelCache[salesOrderId];
    try {
      const label = `Order #${salesOrderId}`;
      orderLabelCache[salesOrderId] = label;
      return label;
    } catch {
      return `Order #${salesOrderId}`;
    }
  }

  // ---- Populate the Sales Order / Product dropdowns so users pick from
  async function populateSalesOrderSelect() {
    try {
      const orders = await apiRequest(`${API_BASE}/SalesOrder/GetALLSalesOrders`);
      salesOrderIdInput.innerHTML = '<option value="">Select a sales order</option>';
      orders.forEach(order => {
        const id = order.SalesOrderId ?? order.salesOrderId;
        if (id == null) return;
        const status = order.Status ?? order.status ?? '';
        const total = order.TotalAmount ?? order.totalAmount ?? 0;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `Order #${id} - ${status} ($${Number(total).toFixed(2)})`;
        salesOrderIdInput.appendChild(option);
      });
    } catch (err) {
      showStatus('Could not load sales orders for the form: ' + err.message, 'error');
    }
  }

  async function populateProductSelect() {
    try {
      const res = await fetch(`${API_BASE}/Product/GetProducts`);
      if (!res.ok) throw new Error('Could not load products.');
      const products = await res.json();
      productIdInput.innerHTML = '<option value="">Select a product</option>';
      products.forEach(product => {
        const id = product.ProductId ?? product.productId;
        if (id == null) return;
        const name = product.Name ?? product.name ?? `Product #${id}`;
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        productIdInput.appendChild(option);
      });
    } catch (err) {
      showStatus('Could not load products for the form: ' + err.message, 'error');
    }
  }

  async function loadItems() {
    clearStatus();

    try {
      const items = await apiRequest(`${API_BASE}/SalesOrderItem/GetALLSalesOrderItems`);

      // Attach the real ID and readable labels to each item before displaying
      for (const item of items) {
        item.realId = realIdOf(item);
        item.displayProductName = await getProductName(productIdOf(item));
        item.displayOrderLabel = await getOrderLabel(salesOrderIdOf(item));
      }

      currentItems = items;
      displayItems(items);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  }

  function displayItems(items) {
    itemsContainer.innerHTML = '';
    if (!items || items.length === 0) {
      itemsContainer.innerHTML = `<div class="empty-items">No sales order items found.</div>`;
      return;
    }

    items.forEach(item => {
      const itemId = item.realId;
      const disabled = itemId === null ? 'disabled' : '';
      const title = itemId === null ? 'title="This item\'s ID is not exposed by the API yet - edit/delete unavailable"' : '';

      const card = document.createElement('div');
      card.className = 'item-card';
      card.innerHTML = `
        <h3>${item.displayOrderLabel} &mdash; ${item.displayProductName}</h3>
        <div class="item-info">
          <div><strong>Sales Order ID:</strong> ${salesOrderIdOf(item) ?? '-'}</div>
          <div><strong>Product ID:</strong> ${productIdOf(item) ?? '-'}</div>
          <div><strong>Quantity:</strong> ${quantityOf(item)}</div>
          <div><strong>Unit Price:</strong> $${Number(unitPriceOf(item)).toFixed(2)}</div>
          <div><strong>Total Price:</strong> <span class="item-total">$${Number(totalPriceOf(item)).toFixed(2)}</span></div>
        </div>
        <div class="item-actions">
          <button class="btn btn-outline" onclick="editItem(${itemId})" ${disabled} ${title}>Edit</button>
          <button class="btn btn-outline" onclick="updateItemQuantity(${itemId})" ${disabled} ${title}>Update Qty</button>
          <button class="btn btn-outline" onclick="deleteItem(${itemId})" ${disabled} ${title}>Delete</button>
        </div>
      `;
      itemsContainer.appendChild(card);
    });
  }

  document.getElementById('addItemBtn').addEventListener('click', () => {
    editingId = null;
    form.reset();
    formTitle.textContent = 'Add Order Item';
    saveBtn.textContent = 'Create Item';
    formCard.hidden = false;
    clearStatus();
  });

  document.getElementById('cancelItemBtn').addEventListener('click', () => {
    form.reset();
    formCard.hidden = true;
    clearStatus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const payload = {
      SalesOrderId: Number(salesOrderIdInput.value),
      ProductId: Number(productIdInput.value),
      Quantity: Number(quantityInput.value),
      UnitPrice: Number(unitPriceInput.value)
    };

    try {
      saveBtn.disabled = true;
      // No editingId means this is a new item, otherwise it's an update
      if (editingId === null) {
        await apiRequest(`${API_BASE}/SalesOrderItem/AddSalesOrderItem`, { method: 'POST', body: JSON.stringify(payload) });
      } else {
        await apiRequest(`${API_BASE}/SalesOrderItem/UpdateSalesOrderItem?id=${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      form.reset();
      formCard.hidden = true;
      loadItems();
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    } finally {
      saveBtn.disabled = false;
    }
  });

  window.editItem = function (id) {
    if (!id) { showStatus("Could not find this item's ID.", 'error'); return; }
    const item = currentItems.find(i => i.realId === id);
    if (!item) { showStatus("Could not find this item's details.", 'error'); return; }

    editingId = id;
    salesOrderIdInput.value = salesOrderIdOf(item);
    productIdInput.value = productIdOf(item);
    quantityInput.value = quantityOf(item);
    unitPriceInput.value = unitPriceOf(item);
    formTitle.textContent = 'Edit Order Item';
    saveBtn.textContent = 'Update Item';
    formCard.hidden = false;
    clearStatus();
  };

  window.updateItemQuantity = async function (id) {
    if (!id) { showStatus("Could not find this item's ID.", 'error'); return; }
    const newQuantity = prompt('Enter new quantity:');
    if (!newQuantity) return;
    if (isNaN(newQuantity) || Number(newQuantity) < 1) { showStatus('Quantity must be a positive number.', 'error'); return; }

    try {
      clearStatus();
      await apiRequest(
        `${API_BASE}/SalesOrderItem/UpdateQuantity?id=${id}&newQuantity=${Number(newQuantity)}`,
        { method: 'PATCH' }
      );
      await loadItems();
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  };

  // Custom confirm popup instead of the browser's default confirm()
  window.deleteItem = function (id) {
    if (!id) { showStatus("Could not find this item's ID.", 'error'); return; }

    const modalEl = document.getElementById('deleteConfirmModal');
    const modal = new bootstrap.Modal(modalEl);
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    // Swap in a fresh button each time so old click listeners don't stack up
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      modal.hide();
      try {
        clearStatus();
        await apiRequest(`${API_BASE}/SalesOrderItem/RemoveSalesOrderItem?id=${id}`, { method: 'DELETE' });
        loadItems();
      } catch (err) {
        showStatus(err.message, 'error');
        console.error(err);
      }
    });

    modal.show();
  };

  document.getElementById('sortBtn').addEventListener('click', async () => {
    try {
      clearStatus();
      const items = await apiRequest(`${API_BASE}/SalesOrderItem/SortByQuantity`);
      for (const item of items) {
        item.realId = realIdOf(item);
        item.displayProductName = await getProductName(productIdOf(item));
        item.displayOrderLabel = await getOrderLabel(salesOrderIdOf(item));
      }
      currentItems = items;
      displayItems(items);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  });

  document.getElementById('filterBtn').addEventListener('click', async () => {
    const productId = document.getElementById('productFilter').value;
    if (!productId) { showStatus('Enter a Product ID first.', 'info'); return; }

    try {
      clearStatus();
      const items = await apiRequest(`${API_BASE}/SalesOrderItem/GetByProduct?productId=${productId}`);
      if (!items || items.length === 0) {
        itemsContainer.innerHTML = `<div class="empty-items">No items found for that product.</div>`;
        return;
      }
      for (const item of items) {
        item.realId = realIdOf(item);
        item.displayProductName = await getProductName(productIdOf(item));
        item.displayOrderLabel = await getOrderLabel(salesOrderIdOf(item));
      }
      currentItems = items;
      displayItems(items);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  });

  document.getElementById('showAllBtn').addEventListener('click', () => {
    document.getElementById('productFilter').value = '';
    loadItems();
  });

  // Run on start
  populateSalesOrderSelect();
  populateProductSelect();
  loadItems();
});