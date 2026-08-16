// API 
const API_BASE = "https://localhost:7111/Warehouse";
let currentWarehouses = []; // Track loaded warehouses globally

function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

// Shows the page content if signed in, or a sign-in message if not.
function checkAccess() {
    const token = localStorage.getItem("token");
    const claims = token ? decodeJwt(token) : null;
    const signedIn = Boolean(token && claims);

    document.getElementById("signedOutNotice")?.classList.toggle("hidden", signedIn);
    document.getElementById("pageContent")?.classList.toggle("hidden", !signedIn);

    return signedIn;
}

//Creates headers for API requests, including the token and JSON type if needed
function authHeaders(withJson){
    const headers = {"Authorization": "Bearer " + localStorage.getItem("token")};
    if (withJson) headers["Content-Type"] = "application/json";
    return headers; 
}

//Adds up the total number of units in a warehouse
function usedOf(w){
    return(w.inventoryLevels ??[]).reduce((sum, il) => sum + (il.quantityOnHand ?? 0),0);
}

//Updates the 3 main statistics: warehouses, total capacity, and units stored
function renderStats(warehouses){
    document.getElementById("statCount").textContent = warehouses.length;
    document.getElementById("statCapacity").textContent = warehouses.reduce((s, w) => s + (w.capacity ?? 0),0).toLocaleString();
    document.getElementById("statUsed").textContent = warehouses.reduce((s, w) => s + usedOf(w),0).toLocaleString();
}

//Changes the capacity bar color based on how full the warehouse is
//Under 50% -> Green // 50% to 79% -> Yellow // 80% and above -> Red
function capacityColor(pct){
    if (pct >=80)return "#dc3545"; // red"
    if (pct >=50)return "#ffc107"; // yellow
    return "#198754"; // green
}

//Displays each warehouse as a card and updates the statistics
function renderWarehouses(warehouses){
    const grid = document.getElementById("warehouseGrid");
    grid.innerHTML = ""; // Clear existing content
    
    renderStats(warehouses); // Update statistics

    if (!warehouses.length){
        grid.innerHTML = "<p class='text-center'>No warehouses found.</p>";
        return; 
    }

    // Go through every warehouse one at a time and build a card for it 
    warehouses.forEach(w => {
        const used = usedOf(w);
        const cap = w.capacity ?? 0;
        const pct = cap > 0 ? Math.min(100, Math.round((used/cap)*100)) : 0;
        const card= document.createElement("div");
        card.className = "card-module wh-card";
        card.dataset.id = w.warehouseId;
        card.dataset.name = w.name;
        card.dataset.capacity = cap;
        card.dataset.location = w.location ?? "";
        card.dataset.phone = w.phone ?? "";
        //Builds the warehouse card shown on the page
        card.innerHTML=
        `
        <div class="wh-card-top">
            <div><h3>${w.name}</h3>
            <div class="wh-loc">${w.location ?? ""}</div></div>
            <span class="wh-id">#${w.warehouseId}</span>
        </div>
          <div class="capacity-block">
        <div class="capacity-labels"><span>${used.toLocaleString()} on hand</span><span>${cap.toLocaleString()} capacity</span></div>
        <div class="capacity-track"><div class="capacity-fill" style="width:${pct}%; background:${capacityColor(pct)}"></div></div>
      </div>
      <div class="wh-actions">
        <button class="btn btn-outline btn-sm" type="button" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" type="button" data-action="delete">Delete</button>
      </div>
        `
    grid.appendChild(card);
    });
}   

//Handles clicks on warehouse cards and identifies which button was clicked
document.getElementById("warehouseGrid")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]"); // find the button that was clicked
  if (!btn) return; // if we didn't click a button, do nothing

  const card = btn.closest(".wh-card"); // find which warehouse card this button belongs to
  const id = card.dataset.id;
  const action = btn.dataset.action;    // is it "edit" or "delete"?

  if (action === "edit") {
    editWarehouse(id, card);
    return;
  }

  if (action === "delete") {
    deleteWarehouse(id);
  }
});

//Gets all warehouses from the API and displays them on the page
function getAllWarehouses() {
  fetch(`${API_BASE}/GetWarehouses`, { headers: authHeaders(false) })
    .then(res => res.json())
    .then(data => {
      currentWarehouses = data;
      renderWarehouses(currentWarehouses);
    })
    .catch(error => console.error("Error fetching warehouses:", error));
}

//Finds warehouses based on the location entered by the user
document.getElementById("filterBtn")?.addEventListener("click", () => {
  const loc = document.getElementById("locationFilter").value.trim();
  fetch(`${API_BASE}/FilterWarehousesByLocation?location=${encodeURIComponent(loc)}`, { headers: authHeaders(false) })
    .then(res => res.json())
    .then(data => renderWarehouses(data))
    .catch(err => console.error("Filter failed:", err));
});

//Sorts warehouses by the amount of stock they have, from highest to lowest
document.getElementById("sortBtn")?.addEventListener("click", () => {
  fetch(`${API_BASE}/SortWarehousesByUsedCapacity`, { headers: authHeaders(false) })
    .then(res => res.json())
    .then(data => renderWarehouses(data))
    .catch(err => console.error("Sort failed:", err));
});

//Clears the search and shows all warehouses again
document.getElementById("clearBtn")?.addEventListener("click", () => {
  document.getElementById("locationFilter").value = "";
  getAllWarehouses();
});

//Gets the form data, adds a new warehouse through the API, and refreshes the list
document.getElementById("addForm")?.addEventListener("submit", (e) => {
  e.preventDefault(); // stop the page from doing a normal (full) reload

  const status = document.getElementById("addStatus");
  const fd = new FormData(e.target); // grabs all the values typed into the form

  const payload = {
    Name: fd.get("Name"),
    Capacity: Number(fd.get("Capacity")),
    Location: fd.get("Location"),
    Phone: fd.get("Phone")
  };

  status.textContent = "Adding…";

  fetch(`${API_BASE}/AddWarehouse`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify(payload)
  })
    .then(res => res.ok ? getAllWarehouses() : Promise.reject(res.status))
    .then(() => {
      status.textContent = "Warehouse added.";
      e.target.reset(); // clears the form fields back to empty
    })
    .catch(err => {
      status.textContent = "Could not add warehouse: " + err;
    });
});

//Opens a popup to edit the selected warehouse and fills it with its current details
function editWarehouse(id, card) {
  // overlay: the dark, see-through background behind the popup box.
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center; z-index: 1000;`;

  //actual white popup box with the input fields inside it.
  overlay.innerHTML = 
  `
    <div style="background:#fff; border-radius:10px; padding:1.5rem; width:320px; max-width:90vw;
                box-shadow:0 10px 30px rgba(0,0,0,0.25); font-family:inherit;">
      <h3 style="margin:0 0 1rem;">Edit Warehouse</h3>

      <label style="display:block; font-size:0.82rem; font-weight:600; margin-bottom:0.9rem;">
        Name
        <input data-field="name" value="${card.dataset.name}"
               style="display:block; width:100%; margin-top:0.3rem; padding:0.5rem; box-sizing:border-box;">
      </label>

      <label style="display:block; font-size:0.82rem; font-weight:600; margin-bottom:0.9rem;">
        Capacity
        <input data-field="capacity" type="number" min="0" value="${card.dataset.capacity}"
               style="display:block; width:100%; margin-top:0.3rem; padding:0.5rem; box-sizing:border-box;">
      </label>

      <label style="display:block; font-size:0.82rem; font-weight:600; margin-bottom:0.9rem;">
        Location
        <input data-field="location" value="${card.dataset.location}"
               style="display:block; width:100%; margin-top:0.3rem; padding:0.5rem; box-sizing:border-box;">
      </label>

      <label style="display:block; font-size:0.82rem; font-weight:600; margin-bottom:1.2rem;">
        Phone
        <input data-field="phone" value="${card.dataset.phone}"
               style="display:block; width:100%; margin-top:0.3rem; padding:0.5rem; box-sizing:border-box;">
      </label>

      <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <button data-action="cancel" type="button" class="btn btn-outline btn-sm">Cancel</button>
        <button data-action="save" type="button" class="btn btn-accent btn-sm">Save</button>
      </div>
    </div>
    `;

  // Add the popup to the page so it actually shows up
  document.body.appendChild(overlay);

  // If the user clicks the dark background (outside the white box), close the popup without saving anything
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // "Cancel" button just closes the popup, no changes are saved
  overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => overlay.remove());

  // "Save" button reads whatever the user typed, sends it to the API to update the warehouse, then closes the popup and refreshes the list
  overlay.querySelector('[data-action="save"]').addEventListener("click", () => {
    const qs = new URLSearchParams({
      id,
      name: overlay.querySelector('[data-field="name"]').value,
      capacity: overlay.querySelector('[data-field="capacity"]').value,
      location: overlay.querySelector('[data-field="location"]').value,
      phone: overlay.querySelector('[data-field="phone"]').value
    });

    fetch(`${API_BASE}/UpdateWarehouse?${qs}`, { method: "PUT", headers: authHeaders(false) })
      .then(res => res.ok ? getAllWarehouses() : Promise.reject(res.status))
      .then(() => overlay.remove())
      .catch(err => alert("Update failed: " + err));
  });
}

//Opens a popup to confirm if the user wants to delete the warehouse
function deleteWarehouse(id) {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center; z-index: 1000;`;

  overlay.innerHTML = `
    <div style="background:#fff; border-radius:10px; padding:1.5rem; width:320px; max-width:90vw;
                box-shadow:0 10px 30px rgba(0,0,0,0.25); font-family:inherit;">
      <h3 style="margin:0 0 0.75rem;">Delete Warehouse</h3>
      <p style="margin:0 0 1.2rem; font-size:0.9rem; color:#555;">
        This can't be undone. Are you sure you want to delete this warehouse?
      </p>
      <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
        <button data-action="cancel" type="button" class="btn btn-outline btn-sm">Cancel</button>
        <button data-action="confirm" type="button" class="btn btn-danger btn-sm">Delete</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Clicking the dark background closes the popup without deleting anything
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  // "Cancel" button just closes the popup, warehouse stays untouched
  overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => overlay.remove());

  // "Delete" button actually tells the API to remove the warehouse, then closes the popup and refreshes the list
  overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => {
    fetch(`${API_BASE}/DeleteWarehouse?id=${id}`, { method: "DELETE", headers: authHeaders(false) })
      .then(res => res.ok ? getAllWarehouses() : Promise.reject(res.status))
      .then(() => overlay.remove())
      .catch(err => alert("Delete failed: " + err));
  });
}

//Loads the warehouses and displays them when the page opens
document.addEventListener("DOMContentLoaded", () => {
  if (checkAccess()) {
    getAllWarehouses();
  }
});