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
    const clearButton = document.getElementById('clearSupplierBtn');


    function showStatus(message, type = 'info') {
        statusBanner.textContent = message;
        statusBanner.className = `status-banner ${type}`;
        statusBanner.hidden = false;
    }


    function clearStatus() {
        statusBanner.hidden = true;
    }


    function getToken() {
        return localStorage.getItem(TOKEN_KEY);
    }


    function checkToken() {

        const token = getToken();

        if (!token) {
            showStatus(
                'Please register or sign in first.',
                'error'
            );

            return null;
        }

        return token;
    }


    // Find the real SupplierId because SupplierId
    // is hidden from JSON by [JsonIgnore]
    async function findSupplierId(supplier, token) {

        // This project has a small training database.
        // Check possible IDs until the matching supplier is found.
        for (let id = 1; id <= 200; id++) {

            const response = await fetch(
                `${API_BASE}/Supplier/GetSupplier?id=${id}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (response.status === 404) {
                continue;
            }


            if (response.status === 401) {
                throw new Error(
                    'Your login session is invalid or expired.'
                );
            }


            if (response.status === 403) {
                throw new Error(
                    'Only Manager or Admin users can manage suppliers.'
                );
            }


            if (!response.ok) {
                continue;
            }


            const result = await response.json();


            // Compare the supplier information
            if (
                result.name === supplier.name &&
                result.email === supplier.email &&
                result.phone === supplier.phone
            ) {
                return id;
            }
        }


        return null;
    }


    // Load all suppliers
    async function loadSuppliers() {

        const token = checkToken();

        if (!token) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/Supplier/GetAllSuppliers`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (response.status === 401) {
                throw new Error(
                    'Your login session is invalid or expired.'
                );
            }


            if (response.status === 403) {
                throw new Error(
                    'Only Manager or Admin users can manage suppliers.'
                );
            }


            if (response.status === 404) {

                tableBody.innerHTML = '';

                showStatus(
                    'There are no suppliers yet.',
                    'info'
                );

                return;
            }


            if (!response.ok) {

                const message = await response.text();

                throw new Error(
                    message || 'Could not load suppliers.'
                );
            }


            const suppliers = await response.json();


            // Find the hidden ID for every supplier
            for (const supplier of suppliers) {

                supplier.realId =
                    await findSupplierId(supplier, token);
            }


            displaySuppliers(suppliers);

            clearStatus();

        }
        catch (error) {

            showStatus(error.message, 'error');

        }
    }


    // Display suppliers
    function displaySuppliers(suppliers) {

        tableBody.innerHTML = '';


        suppliers.forEach(supplier => {

            const row = document.createElement('tr');


            const idCell = document.createElement('td');

            idCell.textContent =
                supplier.realId ?? '-';


            const nameCell = document.createElement('td');

            nameCell.textContent =
                supplier.name;


            const emailCell = document.createElement('td');

            emailCell.textContent =
                supplier.email;


            const phoneCell = document.createElement('td');

            phoneCell.textContent =
                supplier.phone;


            const actionsCell =
                document.createElement('td');


            // Edit button
            const editButton =
                document.createElement('button');

            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.className = 'btn';


            editButton.addEventListener('click', () => {

                editSupplier(supplier);

            });


            // Delete button
            const deleteButton =
                document.createElement('button');

            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn';


            deleteButton.addEventListener('click', () => {

                deleteSupplier(supplier.realId);

            });


            // Disable actions if the ID could not be found
            if (supplier.realId === null) {

                editButton.disabled = true;
                deleteButton.disabled = true;

            }


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


    // Form submit
    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        clearStatus();


        if (supplierId.value === '') {

            await addSupplier();

        }
        else {

            await updateSupplier(supplierId.value);

        }

    });


    // Clear button
    clearButton.addEventListener('click', () => {

        supplierId.value = '';

        saveButton.textContent =
            'Save Supplier';

        clearStatus();

    });


    // Add supplier
    async function addSupplier() {

        const token = checkToken();

        if (!token) {
            return;
        }


        const supplier = {

            Name: supplierName.value,
            Phone: supplierPhone.value,
            Email: supplierEmail.value

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

                const message =
                    await response.text();

                throw new Error(
                    message ||
                    'Could not add supplier.'
                );
            }


            form.reset();

            supplierId.value = '';

            saveButton.textContent =
                'Save Supplier';


            await loadSuppliers();


            showStatus(
                'Supplier added successfully.',
                'success'
            );

        }
        catch (error) {

            showStatus(
                error.message,
                'error'
            );

        }
    }


    // Fill form for editing
    function editSupplier(supplier) {

        if (supplier.realId === null) {

            showStatus(
                'Could not find supplier ID.',
                'error'
            );

            return;
        }


        supplierId.value =
            supplier.realId;

        supplierName.value =
            supplier.name;

        supplierEmail.value =
            supplier.email;

        supplierPhone.value =
            supplier.phone;


        saveButton.textContent =
            'Update Supplier';


        clearStatus();

    }


    // Update supplier
    async function updateSupplier(id) {

        const token = checkToken();

        if (!token) {
            return;
        }


        const parameters =
            new URLSearchParams({

                id: id,

                name:
                    supplierName.value,

                phone:
                    supplierPhone.value,

                email:
                    supplierEmail.value

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

                const message =
                    await response.text();

                throw new Error(
                    message ||
                    'Could not update supplier.'
                );
            }


            form.reset();

            supplierId.value = '';

            saveButton.textContent =
                'Save Supplier';


            await loadSuppliers();


            showStatus(
                'Supplier updated successfully.',
                'success'
            );

        }
        catch (error) {

            showStatus(
                error.message,
                'error'
            );

        }
    }


    // Delete supplier
    async function deleteSupplier(id) {

        if (id === null) {

            showStatus(
                'Could not find supplier ID.',
                'error'
            );

            return;
        }


        const token = checkToken();

        if (!token) {
            return;
        }


        const confirmDelete = confirm(
            'Are you sure you want to delete this supplier?'
        );


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

                const message =
                    await response.text();

                throw new Error(
                    message ||
                    'Could not delete supplier.'
                );
            }


            if (supplierId.value == id) {

                form.reset();

                supplierId.value = '';

                saveButton.textContent =
                    'Save Supplier';
            }


            await loadSuppliers();


            showStatus(
                'Supplier deleted successfully.',
                'success'
            );

        }
        catch (error) {

            showStatus(
                error.message,
                'error'
            );

        }
    }


    // Run when page opens
    loadSuppliers();

});