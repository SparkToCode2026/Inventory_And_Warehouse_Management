const API_BASE = 'https://localhost:7111';
const TOKEN_KEY = 'token';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('customerForm');

    const customerId = document.getElementById('customerId');
    const customerName = document.getElementById('customerName');
    const customerEmail = document.getElementById('customerEmail');
    const customerPhone = document.getElementById('customerPhone');
    const customerLocation = document.getElementById('customerLocation');

    const tableBody = document.getElementById('customerTableBody');
    const statusBanner = document.getElementById('statusBanner');

    const saveButton = document.getElementById('saveCustomerBtn');
    const clearButton = document.getElementById('clearCustomerBtn');


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
            return null;
        }

        return token;
    }


    async function loadCustomers() {

        const token = checkToken();

        if (!token) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/Customer/GetAllCustomers`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (response.status === 401) {
                throw new Error('Your login session is invalid or expired.');
            }


            if (response.status === 403) {
                throw new Error('You are not allowed to access customers.');
            }


            if (response.status === 404) {
                tableBody.innerHTML = '';
                return;
            }


            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not load customers.');
            }


            const customers = await response.json();

            displayCustomers(customers);

            clearStatus();

        }
        catch (error) {

            showStatus(error.message, 'error');

        }
    }


    function displayCustomers(customers) {

        tableBody.innerHTML = '';


        customers.forEach(customer => {

            const row = document.createElement('tr');


            const idCell = document.createElement('td');
            idCell.textContent = customer.customerId;


            const nameCell = document.createElement('td');
            nameCell.textContent = customer.name;


            const emailCell = document.createElement('td');
            emailCell.textContent = customer.email;


            const phoneCell = document.createElement('td');
            phoneCell.textContent = customer.phone;


            const locationCell = document.createElement('td');
            locationCell.textContent = customer.location;


            const actionsCell = document.createElement('td');


            const editButton = document.createElement('button');
            editButton.type = 'button';
            editButton.textContent = 'Edit';
            editButton.className = 'btn btn-outline';

            editButton.addEventListener('click', () => {
                editCustomer(customer);
            });


            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'btn btn-outline';

            deleteButton.addEventListener('click', () => {
                deleteCustomer(customer.customerId);
            });


            actionsCell.appendChild(editButton);
            actionsCell.appendChild(deleteButton);


            row.appendChild(idCell);
            row.appendChild(nameCell);
            row.appendChild(emailCell);
            row.appendChild(phoneCell);
            row.appendChild(locationCell);
            row.appendChild(actionsCell);


            tableBody.appendChild(row);

        });
    }


    form.addEventListener('submit', async (event) => {

        event.preventDefault();

        clearStatus();


        if (customerId.value === '') {

            await addCustomer();

        }
        else {

            await updateCustomer(customerId.value);

        }

    });


    clearButton.addEventListener('click', () => {

        customerId.value = '';

        saveButton.textContent = 'Save Customer';

        clearStatus();

    });


    async function addCustomer() {

        const token = checkToken();

        if (!token) {
            return;
        }


        const customer = {
            Name: customerName.value,
            Phone: customerPhone.value,
            Email: customerEmail.value,
            Location: customerLocation.value
        };


        try {

            const response = await fetch(
                `${API_BASE}/Customer/AddCustomer`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },

                    body: JSON.stringify(customer)
                }
            );


            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not add customer.');
            }


            form.reset();

            customerId.value = '';

            saveButton.textContent = 'Save Customer';


            await loadCustomers();


            showStatus('Customer added successfully.', 'success');

        }
        catch (error) {

            showStatus(error.message, 'error');

        }
    }


    function editCustomer(customer) {

        customerId.value = customer.customerId;

        customerName.value = customer.name;
        customerEmail.value = customer.email;
        customerPhone.value = customer.phone;
        customerLocation.value = customer.location;

        saveButton.textContent = 'Update Customer';

        clearStatus();

    }


    async function updateCustomer(id) {

        const token = checkToken();

        if (!token) {
            return;
        }


        const parameters = new URLSearchParams({
            id: id,
            name: customerName.value,
            phone: customerPhone.value,
            email: customerEmail.value,
            location: customerLocation.value
        });


        try {

            const response = await fetch(
                `${API_BASE}/Customer/UpdateCustomer?${parameters}`,
                {
                    method: 'PUT',

                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not update customer.');
            }


            form.reset();

            customerId.value = '';

            saveButton.textContent = 'Save Customer';


            await loadCustomers();


            showStatus('Customer updated successfully.', 'success');

        }
        catch (error) {

            showStatus(error.message, 'error');

        }
    }


    async function deleteCustomer(id) {

        const token = checkToken();

        if (!token) {
            return;
        }


        const confirmDelete = confirm(
            'Are you sure you want to delete this customer?'
        );


        if (!confirmDelete) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE}/Customer/DeleteCustomer?id=${id}`,
                {
                    method: 'DELETE',

                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );


            if (response.status === 403) {
                throw new Error('Only Manager or Admin users can delete customers.');
            }


            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || 'Could not delete customer.');
            }


            if (customerId.value == id) {

                form.reset();

                customerId.value = '';

                saveButton.textContent = 'Save Customer';
            }


            await loadCustomers();


            showStatus('Customer deleted successfully.', 'success');

        }
        catch (error) {

            showStatus(error.message, 'error');

        }
    }


    loadCustomers();

});