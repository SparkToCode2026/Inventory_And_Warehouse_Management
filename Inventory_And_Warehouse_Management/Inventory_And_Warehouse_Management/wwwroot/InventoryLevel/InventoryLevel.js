const $ = (id) => document.getElementById(id); // shorthand for document.getElementById
let inventoryLevels = [];        // gets filled by loadFromApi() below
let selectedWarehouseId = null;  // which warehouse's detail modal is currently open (or null if none)

// Fetches warehouse and product names separately and maps them by ID for display
let warehouseNames = {};
let warehouseLocations = {}; // id -> location, used for the "small word under it" in the dropdown and the main list's Location column
let productNames = {};
let warehouseIdByName = {}; // reverse lookup: lowercased name -> id, used to resolve what's typed in the Add forms
let productIdByName = {};
let warehouseList = [];     // flat array of { id, name, location }, used to drive the custom autocomplete dropdown

//API
const API_BASE = 'https://localhost:7111/InventoryLevel';
function apiBase(){ return API_BASE.replace(/\/+$/, ''); }

// Reads the user's role/name from the JWT payload.
function decodeJwt(token){
  try{
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }catch{
    return null;
  }
}

let currentUserRole = null; // filled in by checkAccess() below

// Gets the token, finds the user's role, and shows a message if not logged in.
function checkAccess(){
  const token = localStorage.getItem('token');
  const claims = token ? decodeJwt(token) : null;
  const role = claims?.role
    || claims?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const signedIn = Boolean(token && claims);

  document.getElementById('signedOutNotice')?.classList.toggle('hidden', signedIn);
  document.getElementById('pageContent')?.classList.toggle('hidden', !signedIn);

  if (!signedIn){
    return false;
  }
  currentUserRole = role;
  return true;
}

function authHeaders(){
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

// Handles all API calls, adds headers, parses JSON, and reports errors.
async function apiFetch(path, options){
  const res = await fetch(apiBase() + path, Object.assign({ headers: authHeaders() }, options || {}));
  let body = null;
  try { body = await res.json(); } catch (e) { /* response had no JSON body - that's fine */ }
  if (!res.ok){
    const msg = (body && (body.title || body)) || (res.status + ' ' + res.statusText);
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body;
}

// Sends API requests to other controllers like Warehouse or Product.
async function apiFetchFrom(base, path, options){
  const res = await fetch(base + path, Object.assign({ headers: authHeaders() }, options || {}));
  let body = null;
  try { body = await res.json(); } catch (e) { /* no JSON body */ }
  if (!res.ok){
    const msg = (body && (body.title || body)) || (res.status + ' ' + res.statusText);
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return body;
}

// Fetches warehouses and products in parallel, maps their IDs to names/locations
// (and names back to IDs), builds warehouseList for the autocomplete dropdown,
// and fills in the Product <datalist> options.
async function loadReferenceData(){
  // Reuse API_BASE's protocol/host/port so this only needs updating in one place.
  const origin = new URL(apiBase()).origin; // e.g. "https://localhost:7111"
  const [warehouses, products] = await Promise.all([
    apiFetchFrom(origin + '/Warehouse', '/GetWarehouses').catch(() => []),
    apiFetchFrom(origin + '/Product', '/GetProducts').catch(() => [])
  ]);

  warehouseNames = {};
  warehouseLocations = {};
  warehouseIdByName = {};
  warehouseList = [];
  (warehouses || []).forEach(w => {
    const id = w.warehouseId ?? w.WarehouseId;
    const name = w.name ?? w.Name;
    const location = w.location ?? w.Location ?? '';
    warehouseNames[id] = name;
    warehouseLocations[id] = location;
    if (name) warehouseIdByName[name.trim().toLowerCase()] = id;
    if (name) warehouseList.push({ id, name, location });
  });

  productNames = {};
  productIdByName = {};
  (products || []).forEach(p => {
    const id = p.productId ?? p.ProductId;
    const name = p.name ?? p.Name;
    productNames[id] = name;
    if (name) productIdByName[name.trim().toLowerCase()] = id;
  });

  // Fill in the Product <datalist> options so typing shows a dropdown of real names.
  // (The Warehouse field no longer uses a datalist - see the custom autocomplete
  // widget set up by setupWarehouseAutocomplete() below, which needs warehouseList
  // above to already be populated.)
  $('productNameOptions').innerHTML = Object.values(productNames)
    .filter(Boolean).map(name => `<option value="${name}"></option>`).join('');
}

// Looks up an ID from a typed name using the given reverse-lookup map
// (warehouseIdByName or productIdByName). Matching is case-insensitive
// and ignores extra spaces. Returns null (and shows an error) if there's
// no exact match, e.g. because of a typo.
function resolveIdByName(nameMap, typedValue, label){
  const key = (typedValue || '').trim().toLowerCase();
  if (!key){
    showStatus(`Enter a ${label} name.`, true);
    return null;
  }
  const id = nameMap[key];
  if (id === undefined){
    showStatus(`No ${label} matches "${typedValue}" — pick one from the dropdown.`, true);
    return null;
  }
  return id;
}

/* ============================================================
   WAREHOUSE AUTOCOMPLETE (custom dropdown, not a native <datalist>)
   A native <datalist> can only show one line of plain text per
   suggestion, but we need two lines - the warehouse name, and its
   location underneath in smaller text - so this builds the dropdown
   by hand: an <input> plus a positioned list of matching warehouses,
   filtered live as you type and populated from warehouseList
   (built in loadReferenceData() above).
   ============================================================ */
function setupWarehouseAutocomplete(){
  const input = $('newWarehouseId');
  const list = $('newWarehouseSuggestions');
  if (!input || !list) return; // this input only exists in the Add Inventory Level modal

  function renderSuggestions(){
    const query = input.value.trim().toLowerCase();
    const matches = query
      ? warehouseList.filter(w => w.name.toLowerCase().includes(query))
      : warehouseList; // show everything if the field is empty and focused

    if (matches.length === 0){
      list.innerHTML = `<div class="autocomplete-empty">No matching warehouse</div>`;
    }else{
      list.innerHTML = matches.map(w => `
        <div class="autocomplete-item" data-name="${w.name}">
          <div class="autocomplete-name">${w.name}</div>
          <div class="autocomplete-location">${w.location || 'No location on file'}</div>
        </div>
      `).join('');
    }
    list.classList.remove('hidden');
  }

  function hideSuggestions(){
    list.classList.add('hidden');
  }

  input.addEventListener('input', renderSuggestions);
  input.addEventListener('focus', renderSuggestions);

  // Clicking a suggestion fills the input with the exact warehouse name
  // (mousedown, not click, so this fires before the input's blur event hides the list)
  list.addEventListener('mousedown', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (!item) return;
    input.value = item.dataset.name;
    hideSuggestions();
  });

  // Hide the dropdown when clicking elsewhere, but not so fast that it
  // swallows the click on a suggestion above.
  input.addEventListener('blur', () => setTimeout(hideSuggestions, 120));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideSuggestions();
  });
}

// Fetches inventory data from the database and refreshes the page.
async function loadFromApi(){
  try{
    // Load the name/location lookups first (or alongside) so they're ready by the time we render
    await loadReferenceData();
    inventoryLevels = await apiFetch('/GetInventoryLevels', { method: 'GET' }) || [];
    renderWarehouseList();
    if (selectedWarehouseId !== null) renderWarehouseDetail(selectedWarehouseId);
    // (No success status message here on purpose - loading silently keeps the
    // banner reserved for things that actually need your attention, like errors.)
  }catch(err){
    showStatus('Could not load from API: ' + err.message, true);
  }
}

// Shows a success or error message for 4 seconds.
function showStatus(message, isError){
  const el = $('statusMsg');
  el.textContent = message;
  el.className = 'status-msg show ' + (isError ? 'err' : 'ok');
  setTimeout(() => { el.classList.remove('show'); }, 4000);
}

// Switches between the Warehouses, Low Stock, and Totals sections.
function switchView(view){
  ['warehouses', 'lowstock', 'totals'].forEach(v => {
    $('view-' + v).classList.toggle('hidden', v !== view); // hide every section except the chosen one
  });
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view); // highlight the matching tab
  });
  if (view === 'lowstock') renderLowStock();
  if (view === 'totals') renderTotals();
}
document.querySelectorAll('.nav-link[data-view]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

// Opens the Warehouses tab and scrolls to it.
$('viewWarehousesBtn').addEventListener('click', () => {
  switchView('warehouses');
  document.getElementById('view-warehouses').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Converts inventory data into a simple format and adds warehouse/product names + warehouse location.
function levelFields(il){
  const whId = il.warehouseId ?? il.WarehouseId;
  const prId = il.productId ?? il.ProductId;
  return {
    qty: il.quantityOnHand ?? il.QuantityOnHand,
    threshold: il.reorderThreshold ?? il.ReorderThreshold,
    whId: whId,
    prId: prId,
    whName: warehouseNames[whId] ?? il.warehouseName ?? il.WarehouseName ?? null,
    whLocation: warehouseLocations[whId] ?? null,
    prName: productNames[prId] ?? il.productName ?? il.ProductName ?? null
  };
}

// Groups inventory by warehouse and creates a summary row for each one, including its location.
function renderWarehouseList(){
  const container = $('warehouseGroups');
  container.innerHTML = ''; // clear whatever was there before re-rendering
  $('levelsEmpty').classList.toggle('hidden', inventoryLevels.length > 0);
  if (inventoryLevels.length === 0) return; // nothing to show yet
  // Group the flat list into a Map keyed by warehouse ID
  const groups = new Map();
  inventoryLevels.forEach(il => {
    const f = levelFields(il);
    if (!groups.has(f.whId)) groups.set(f.whId, { whId: f.whId, whName: f.whName, whLocation: f.whLocation, items: [] });
    const g = groups.get(f.whId);
    if (!g.whName && f.whName) g.whName = f.whName; // fill in the name the first time we see it
    if (!g.whLocation && f.whLocation) g.whLocation = f.whLocation;
    g.items.push(f);
  });
  // Sort warehouses by ID so the list order is stable/predictable
  const sortedGroups = Array.from(groups.values()).sort((a, b) => a.whId - b.whId);
  // Build the summary table as an HTML string, one <tr> per warehouse
  const tableWrap = document.createElement('div');
  tableWrap.className = 'card-module table-wrap';
  tableWrap.innerHTML = `
    <table>
      <thead>
        <tr><th>Warehouse</th><th>Location</th><th>Products</th><th>Total units</th><th>Low stock</th><th></th></tr>
      </thead>
      <tbody></tbody>
    </table>
  `;
  const tbody = tableWrap.querySelector('tbody');
  sortedGroups.forEach(g => {
    const totalUnits = g.items.reduce((sum, it) => sum + (it.qty || 0), 0);       // sum of all quantities
    const lowCount = g.items.filter(it => it.qty < it.threshold).length;          // count of low-stock products
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><button class="warehouse-link" data-wh="${g.whId}">${g.whName || ('Warehouse ' + g.whId)}</button></td>
      <td class="wh-location-cell">${g.whLocation || '—'}</td>
      <td>${g.items.length}</td>
      <td>${totalUnits}</td>
      <td>${lowCount > 0 ? `<span class="badge badge-low">${lowCount} low</span>` : `<span class="badge badge-ok">All OK</span>`}</td>
      <td><button class="btn btn-outline btn-sm" data-wh="${g.whId}">View details →</button></td>
    `;
    tbody.appendChild(tr);
  });
  container.appendChild(tableWrap);
  // Both the warehouse name link AND the "View details" button open the same modal
  container.querySelectorAll('[data-wh]').forEach(el => {
    el.addEventListener('click', () => openWarehouseDetail(el.dataset.wh));
  });
}

// Opens the warehouse detail popup and shows its data.
function openWarehouseDetail(warehouseId){
  selectedWarehouseId = warehouseId;
  renderWarehouseDetail(warehouseId);
  $('detailModalOverlay').classList.add('show'); // reveal the modal (see .modal-overlay.show in CSS)
}

// Closes the modal and forgets which warehouse was selected
function closeWarehouseDetail(){
  $('detailModalOverlay').classList.remove('show');
  selectedWarehouseId = null;
}

// Updates the modal with the warehouse's latest details and products.
function renderWarehouseDetail(warehouseId){
  // Filter the full inventoryLevels list down to just this warehouse's products
  const items = inventoryLevels.map(levelFields).filter(f => String(f.whId) === String(warehouseId));
  const whName = items.find(it => it.whName)?.whName;

  // Just the warehouse name - no "ID X" tag.
  $('detailTitle').textContent = whName || ('Warehouse ' + warehouseId);

  // Products stocked / total units / low stock, all on one line instead of 3 separate cards.
  const totalUnits = items.reduce((sum, it) => sum + (it.qty || 0), 0);
  const lowCount = items.filter(it => it.qty < it.threshold).length;
  $('statLine').innerHTML = `
    <strong>${items.length}</strong> product${items.length === 1 ? '' : 's'} stocked
    &nbsp;·&nbsp;
    <strong>${totalUnits}</strong> total unit${totalUnits === 1 ? '' : 's'} on hand
    &nbsp;·&nbsp;
    <strong class="${lowCount > 0 ? 'warn' : ''}">${lowCount}</strong> low stock item${lowCount === 1 ? '' : 's'}
  `;

  // Product table rows
  const body = $('detailProductsBody');
  body.innerHTML = '';
  $('detailProductsEmpty').classList.toggle('hidden', items.length > 0);
  items.sort((a, b) => a.prId - b.prId).forEach(it => {
    const low = it.qty < it.threshold;
    // Shows the delete button only to Managers and Admins.
    const canDelete = currentUserRole === 'Manager' || currentUserRole === 'Admin';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="product-name">${it.prName || ('Product ' + it.prId)}</div>
        <div class="product-id">ID ${it.prId}</div>
      </td>
      <td>${it.qty}</td>
      <td>${it.threshold}</td>
      <td><span class="badge ${low ? 'badge-low' : 'badge-ok'}">${low ? 'Low stock' : 'OK'}</span></td>
      <td>
        <div class="row-actions">
          <!-- Type a positive or negative number here, e.g. "-5" or "20" -->
          <input type="number" class="qty-input" placeholder="±qty" id="delta-${it.prId}">
          <button class="btn btn-outline btn-sm" data-action="adjust" data-pr="${it.prId}">Apply</button>
        </div>
      </td>
      <td>${canDelete ? `<button class="btn btn-danger btn-sm" data-action="delete" data-pr="${it.prId}">Delete</button>` : ''}</td>
    `;
    body.appendChild(tr);
  });
  // Wire up the Apply / Delete buttons that were just created
  body.querySelectorAll('[data-action="adjust"]').forEach(btn => {
    btn.addEventListener('click', () => adjustQuantity(warehouseId, btn.dataset.pr));
  });
  body.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', () => deleteLevel(warehouseId, btn.dataset.pr));
  });
}

// Close button (✕) inside the detail modal
$('closeDetailModalBtn').addEventListener('click', closeWarehouseDetail);
// Clicking the dark backdrop (outside the white box) also closes the modal
$('detailModalOverlay').addEventListener('click', (e) => {
  if (e.target === $('detailModalOverlay')) closeWarehouseDetail();
});

// Opens and closes the Add Inventory modal.
function openAddModal(){ $('addModalOverlay').classList.add('show'); }
function closeAddModal(){ $('addModalOverlay').classList.remove('show'); }
$('openAddModalBtn').addEventListener('click', openAddModal);   // hero button
$('closeAddModalBtn').addEventListener('click', closeAddModal); // ✕ button
$('cancelAddBtn').addEventListener('click', closeAddModal);     // Cancel button
$('addModalOverlay').addEventListener('click', (e) => {
  if (e.target === $('addModalOverlay')) closeAddModal(); // click outside the box to close
});

// Pressing Escape closes whichever modal is open
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    closeAddModal();
    closeWarehouseDetail();
  }
});

// Adjusts a product's quantity in a warehouse and refreshes the data.
async function adjustQuantity(warehouseId, productId){
  const input = $(`delta-${productId}`);
  const delta = parseInt(input.value, 10);
  if (isNaN(delta)){ showStatus('Enter a whole number to adjust by.', true); return; }
  try{
    await apiFetch(`/AdjustQuantity?warehouseId=${warehouseId}&productId=${productId}&delta=${delta}`, { method: 'PATCH' });
    showStatus('Quantity adjusted.', false);
    await loadFromApi();
    renderWarehouseDetail(warehouseId); // keep the open modal in sync
  }catch(err){
    showStatus('Adjustment failed: ' + err.message, true);
  }
}

// Removes a product from a warehouse and refreshes the data.
async function deleteLevel(warehouseId, productId){
  if (!confirm('Delete this inventory level?')) return; // simple browser confirmation
  try{
    await apiFetch(`/DeleteInventoryLevel?warehouseId=${warehouseId}&productId=${productId}`, { method: 'DELETE' });
    showStatus('Inventory level deleted.', false);
    await loadFromApi();
    renderWarehouseDetail(warehouseId);
  }catch(err){
    showStatus('Delete failed: ' + err.message, true);
  }
}

// Adds a new inventory level using the form (warehouse + product picked BY NAME) and saves it to the database.
async function addLevel(){
  const warehouseId = resolveIdByName(warehouseIdByName, $('newWarehouseId').value, 'warehouse');
  const productId = resolveIdByName(productIdByName, $('newProductId').value, 'product');
  const quantityOnHand = parseInt($('newQuantity').value, 10);
  const reorderThreshold = parseInt($('newThreshold').value, 10);

  if (warehouseId === null || productId === null) return; // resolveIdByName already showed an error
  if ([quantityOnHand, reorderThreshold].some(isNaN)){
    showStatus('Fill in quantity and reorder threshold with numbers.', true);
    return;
  }

  try{
    await apiFetch('/AddInventoryLevel', {
      method: 'POST',
      body: JSON.stringify({ WarehouseId: warehouseId, ProductId: productId, QuantityOnHand: quantityOnHand, ReorderThreshold: reorderThreshold })
    });
    showStatus('Inventory level added.', false);
    ['newWarehouseId','newProductId','newQuantity','newThreshold'].forEach(id => $(id).value = ''); // clear the form
    await loadFromApi();
    closeAddModal();
  }catch(err){
    showStatus('Add failed: ' + err.message, true);
  }
}

// Adds a product (picked BY NAME) to the selected warehouse and saves it to the database.
async function addProductToDetail(){
  if (selectedWarehouseId === null) return; // safety check - shouldn't happen since the form only shows inside the modal
  const warehouseId = parseInt(selectedWarehouseId, 10);
  const productId = resolveIdByName(productIdByName, $('detailProductId').value, 'product');
  const quantityOnHand = parseInt($('detailQuantity').value, 10);
  const reorderThreshold = parseInt($('detailThreshold').value, 10);

  if (productId === null) return; // resolveIdByName already showed an error
  if ([quantityOnHand, reorderThreshold].some(isNaN)){
    showStatus('Fill in quantity and reorder threshold with numbers.', true);
    return;
  }

  try{
    await apiFetch('/AddInventoryLevel', {
      method: 'POST',
      body: JSON.stringify({ WarehouseId: warehouseId, ProductId: productId, QuantityOnHand: quantityOnHand, ReorderThreshold: reorderThreshold })
    });
    showStatus('Product added to warehouse.', false);
    ['detailProductId','detailQuantity','detailThreshold'].forEach(id => $(id).value = '');
    await loadFromApi();
    renderWarehouseDetail(selectedWarehouseId); // keep the open modal showing the new product immediately
  }catch(err){
    showStatus('Add failed: ' + err.message, true);
  }
}

// Shows products with stock below their reorder threshold.
function renderLowStock(){
  const data = inventoryLevels.map(levelFields).filter(f => f.qty < f.threshold);
  const body = $('lowStockBody');
  body.innerHTML = '';
  $('lowStockEmpty').classList.toggle('hidden', data.length > 0);
  data.forEach(f => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${f.whName || f.whId}</td><td>${f.prName || f.prId}</td><td>${f.qty}</td><td>${f.threshold}</td>`;
    body.appendChild(tr);
  });
}

// Shows the total quantity of each product across all warehouses.
function renderTotals(){
  const totalsByProduct = new Map();
  inventoryLevels.map(levelFields).forEach(f => {
    totalsByProduct.set(f.prId, (totalsByProduct.get(f.prId) || 0) + (f.qty || 0));
  });
  const list = $('totalsList');
  list.innerHTML = '';
  $('totalsEmpty').classList.toggle('hidden', totalsByProduct.size > 0);
  Array.from(totalsByProduct.entries())
    .sort((a, b) => b[1] - a[1]) // highest total first
    .forEach(([productId, total]) => {
      const row = document.createElement('div');
      row.className = 'totals-row';
      row.innerHTML = `<span>Product ${productId}</span><span>${total} units</span>`;
      list.appendChild(row);
    });
}

// Connects all page buttons to their functions.
$('refreshLevelsBtn').addEventListener('click', loadFromApi);
$('refreshLowStockBtn').addEventListener('click', renderLowStock);
$('refreshTotalsBtn').addEventListener('click', renderTotals);
$('addBtn').addEventListener('click', addLevel);
$('detailAddBtn').addEventListener('click', addProductToDetail);

// Loads data from the database when the page opens if a valid token exists.
document.addEventListener('DOMContentLoaded', () => {
  setupWarehouseAutocomplete();
  if (checkAccess()) loadFromApi();
});