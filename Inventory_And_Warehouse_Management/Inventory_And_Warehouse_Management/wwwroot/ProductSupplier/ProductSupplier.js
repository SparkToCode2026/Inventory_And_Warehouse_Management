const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('linkForm');
  const formCard = document.getElementById('linkFormCard');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveLinkBtn');
  const statusBanner = document.getElementById('statusBanner');
  const linksContainer = document.getElementById('linksContainer');
  const siteNav = document.getElementById('siteNav');
  const addLinkBtn = document.getElementById('addLinkBtn');

  const productIdInput = document.getElementById('productId');
  const supplierIdInput = document.getElementById('supplierId');

  // editingKey holds the ORIGINAL productId/supplierId of the link being edited
  let editingKey = null;
  let currentLinks = [];
  let canManage = false; // Manager/Admin only - controls Add/Delete
  let signedIn = false;  // any logged-in user - controls Edit/Change Supplier

  function decodeJwt(token) {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  // Reads the role from the token and shows/hides Add/Delete accordingly
  function checkAccess() {
    const token = localStorage.getItem(TOKEN_KEY);
    const claims = token ? decodeJwt(token) : null;
    const role = claims?.role
      || claims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || claims?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'];

    signedIn = Boolean(token && claims);
    canManage = signedIn && (role === 'Manager' || role === 'Admin');

    addLinkBtn.classList.toggle('hidden', !canManage);

    if (signedIn) {
      siteNav.innerHTML = `<button type="button" class="btn btn-ghost" id="signOutBtn">Sign Out</button>`;
      document.getElementById('signOutBtn').addEventListener('click', () => {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '../index.html';
      });
    } else {
      siteNav.innerHTML = `<a href="../Register/login.html" class="btn btn-ghost">Sign In</a>`;
    }
  }

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
    if (response.status === 401) throw new Error('Not authorized. Please log in.');
    if (response.status === 403) throw new Error('You do not have permission to do that.');

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
    return body;
  }

  // Field readers - GetAllProductSuppliers returns nested product/supplier
  // objects (with names) alongside the plain productId/supplierId
  function productIdOf(link) { return link.productId ?? link.ProductId; }
  function supplierIdOf(link) { return link.supplierId ?? link.SupplierId; }
  function productNameOf(link) {
    const p = link.product ?? link.Product;
    return p?.Name ?? p?.name ?? `Product #${productIdOf(link)}`;
  }
  function supplierNameOf(link) {
    const s = link.supplier ?? link.Supplier;
    return s?.Name ?? s?.name ?? `Supplier #${supplierIdOf(link)}`;
  }

  async function loadLinks() {
    clearStatus();
    try {
      const links = await apiRequest(`${API_BASE}/ProductSupplier/GetAllProductSuppliers`);
      currentLinks = links;
      displayLinks(links);
    } catch (err) {
      showStatus(err.message, 'error');
      console.error(err);
    }
  }

  function displayLinks(links) {
    linksContainer.innerHTML = '';
    if (!links || links.length === 0) {
      linksContainer.innerHTML = `<div class="empty-links">No product-supplier links found.</div>`;
      return;
    }

    links.forEach(link => {
      const pId = productIdOf(link);
      const sId = supplierIdOf(link);

      const editBtn = signedIn
        ? `<button class="btn btn-outline" onclick="editLink(${pId}, ${sId})">Edit</button>`
        : '';
      const changeSupplierBtn = signedIn
        ? `<button class="btn btn-outline" onclick="changeSupplier(${pId}, ${sId})">Change Supplier</button>`
        : '';
      const deleteBtn = canManage
        ? `<button class="btn btn-outline" onclick="deleteLink(${pId}, ${sId})">Delete</button>`
        : '';

      const card = document.createElement('div');
      card.className = 'link-card';
      card.innerHTML = `
        <h3>${productNameOf(link)} &mdash; ${supplierNameOf(link)}</h3>
        <div class="link-info">
          <div><strong>Product ID:</strong> ${pId}</div>
          <div><strong>Supplier ID:</strong> ${sId}</div>
        </div>
        <div class="link-actions">
          ${editBtn} ${changeSupplierBtn} ${deleteBtn}
        </div>
      `;
      linksContainer.appendChild(card);
    });
  }

  // ---- Add / Edit form ----

  addLinkBtn.addEventListener('click', () => {
    editingKey = null;
    form.reset();
    formTitle.textContent = 'Add Link';
    saveBtn.textContent = 'Create Link';
    formCard.hidden = false;
    clearStatus();
  });

  document.getElementById('cancelLinkBtn').addEventListener('click', () => {
    form.reset();
    formCard.hidden = true;
    clearStatus();
  });

  window.editLink = function (pId, sId) {
    editingKey = { productId: pId, supplierId: sId };
    productIdInput.value = pId;
    supplierIdInput.value = sId;
    formTitle.textContent = 'Edit Link';
    saveBtn.textContent = 'Update Link';
    formCard.hidden = false;
    clearStatus();
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearStatus();

    const newProductId = Number(productIdInput.value);
    const newSupplierId = Number(supplierIdInput.value);

    try {
      saveBtn.disabled = true;

      if (editingKey === null) {
        // Create: body is a plain ProductSupplier object
        await apiRequest(`${API_BASE}/ProductSupplier/AddProductSupplier`, {
          method: 'POST',
          body: JSON.stringify({ productId: newProductId, supplierId: newSupplierId })
        });
      } else {
        // Update: this endpoint takes everything as query params, no body
        const params = new URLSearchParams({
          pId: editingKey.productId,
          sId: editingKey.supplierId,
          newProductId,
          newSupplierId
        });
        await apiRequest(`${API_BASE}/ProductSupplier/UpdateProductSupplier?${params}`, {
          method: 'PUT'
        });
      }

      form.reset();
      formCard.hidden = true;
      editingKey = null;
      loadLinks();
    } catch (err) {
      showStatus(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // ---- Quick "change supplier only" action ----

  window.changeSupplier = async function (pId, sId) {
    const newSupplierId = prompt('Enter the new Supplier ID for this product:', sId);
    if (!newSupplierId) return;

    try {
      clearStatus();
      const params = new URLSearchParams({ pId, newSupplierId });
      await apiRequest(`${API_BASE}/ProductSupplier/UpdateSupplierForProduct?${params}`, { method: 'PATCH' });
      loadLinks();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  };

  // ---- Delete (custom modal, same pattern as other pages) ----

  window.deleteLink = function (pId, sId) {
    const modalEl = document.getElementById('deleteConfirmModal');
    const modal = new bootstrap.Modal(modalEl);
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', async () => {
      modal.hide();
      try {
        clearStatus();
        const params = new URLSearchParams({ pId, sId });
        await apiRequest(`${API_BASE}/ProductSupplier/RemoveProductSupplier?${params}`, { method: 'DELETE' });
        loadLinks();
      } catch (err) {
        showStatus(err.message, 'error');
      }
    });

    modal.show();
  };

  // ---- Filter / Count ----

  document.getElementById('filterBtn').addEventListener('click', async () => {
    const supplierId = document.getElementById('supplierFilter').value;
    if (!supplierId) { showStatus('Enter a Supplier ID first.', 'info'); return; }

    try {
      clearStatus();
      const links = await apiRequest(`${API_BASE}/ProductSupplier/FilterProductSuppliersBySupplier?sId=${supplierId}`);
      currentLinks = links;
      displayLinks(links);
    } catch (err) {
      showStatus(err.message, 'error');
    }
  });

  document.getElementById('showAllBtn').addEventListener('click', () => {
    document.getElementById('supplierFilter').value = '';
    loadLinks();
  });

  document.getElementById('countBtn').addEventListener('click', async () => {
    try {
      clearStatus();
      const counts = await apiRequest(`${API_BASE}/ProductSupplier/CountSuppliersPerProduct`);
      const body = document.getElementById('countModalBody');
      body.innerHTML = counts.length
        ? counts.map(c => `<div>Product #${c.ProductId ?? c.productId}: ${c.SupplierCount ?? c.supplierCount} supplier(s)</div>`).join('')
        : '<div>No data yet.</div>';
      new bootstrap.Modal(document.getElementById('countModal')).show();
    } catch (err) {
      showStatus(err.message, 'error');
    }
  });

  // Run on start
  checkAccess();
  loadLinks();
});