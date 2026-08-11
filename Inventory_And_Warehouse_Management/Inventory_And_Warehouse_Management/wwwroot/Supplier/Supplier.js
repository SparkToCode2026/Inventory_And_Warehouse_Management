const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('supplierForm');

    const supplierId = document.getElementById('supplierId');
    const supplierName = document.getElementById('supplierName');
    const supplierEmail = document.getElementById('supplierEmail');
    const supplierPhone = document.getElementById('supplierPhone');

    const tableBody = document.getElementById('supplierTableBody');
    const statusBanner = document.getElementById('statusBanner');
    const saveButton = document.getElementById('saveSupplierBtn');


    function showStatus(message) {
        statusBanner.textContent = message;
        statusBanner.hidden = false;
    }


    function clearStatus() {
        statusBanner.hidden = true;
    }


    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }


    // Load all suppliers
    async function loadSuppliers() {

        const token = getToken();

        try {

            const response = await fetch(
                `${API_BASE}/Supplier/GetAllSuppliers`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            // Your controller returns 404 if there are no suppliers
            if (response.status === 404) {
                tableBody.innerHTML = '';
                showStatus('There are no suppliers yet.');
                return;
            }


            if (!response.ok) {
                throw new Error('Could not load suppliers.');
            }


            const suppliers = await response.json();

            displaySuppliers(suppliers);

        }
        catch (error) {

            showStatus(error.message);

        }
    }


    // Display suppliers inside the table
    function displaySuppliers(suppliers) {

        tableBody.innerHTML = '';

        suppliers.forEach(supplier => {

            const row = document.createElement('tr');


            const idCell = document.createElement('td');
            idCell.textContent = supplier.supplierId;


            const nameCell = document.createElement('td');
            nameCell.textContent = supplier.name;


            const emailCell = document.createElement('td');
            emailCell.textContent = supplier.email;


            const phoneCell = document.createElement('td');
            phoneCell.textContent = supplier.phone;


            const actionsCell = document.createElement('td');


            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';

            editButton.addEventListener('click', () => {
                editSupplier(supplier);
            });


            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';

            deleteButton.addEventListener('click', () => {
                deleteSupplier(supplier.supplierId);
            });


            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);


            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(phoneCell);
            row.appendChild(actionsCell);


            tableBody.appendChild(row);

        });
    }


    // Add or update supplier
    form.addEventListener('submit', async (event) => {

        event.preventDefault();
        clearStatus();

        const id = supplierId.value;


        if (id === '') {

            await addSupplier();

        }
        else {

            await updateSupplier(id);

        }

    });


    // Add supplier
    async function addSupplier() {

        const token = getToken();

        const supplier = {

            Name: supplierName.value,
            Email: supplierEmail.value,
            Phone: supplierPhone.value

        };


        try {

            const response = await fetch(
                `${API_BASE}/Supplier/AddSupplier`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

                    body: JSON.stringify(supplier)
                }
            );


            if (!response.ok) {

                const message = await response.text();

                throw new Error(message || 'Could not add supplier.');
            }


            showStatus('Supplier added successfully.');

            form.reset();

            await loadSuppliers();

        }
        catch (error) {

            showStatus(error.message);

        }
    }


    // Put supplier information into the form
    function editSupplier(supplier) {

        supplierId.value = supplier.supplierId;
        supplierName.value = supplier.name;
        supplierEmail.value = supplier.email;
        supplierPhone.value = supplier.phone;

        saveButton.textContent = 'Update Supplier';

    }


    // Update supplier
    async function updateSupplier(id) {

        const token = getToken();

        const parameters = new URLSearchParams({

            id: id,
            name: supplierName.value,
            phone: supplierPhone.value,
            email: supplierEmail.value

        });


        try {

            const response = await fetch(
                `${API_BASE}/Supplier/UpdateSupplier?${parameters}`,
                {
                    method: 'PUT',

                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (!response.ok) {

                const message = await response.text();

                throw new Error(message || 'Could not update supplier.');
            }


            showStatus('Supplier updated successfully.');

            form.reset();

            supplierId.value = '';

            saveButton.textContent = 'Save Supplier';

            await loadSuppliers();

        }
        catch (error) {

            showStatus(error.message);

        }
    }


    // Delete supplier
    async function deleteSupplier(id) {

        const token = getToken();

        const confirmDelete =
            confirm('Are you sure you want to delete this supplier?');


        if (!confirmDelete) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/Supplier/DeleteSupplier?id=${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (!response.ok) {

                const message = await response.text();

                throw new Error(message || 'Could not delete supplier.');
            }


            showStatus('Supplier deleted successfully.');

            await loadSuppliers();

        }
        catch (error) {

            showStatus(error.message);

        }
    }


    // Load suppliers when the page opens
    loadSuppliers();

});