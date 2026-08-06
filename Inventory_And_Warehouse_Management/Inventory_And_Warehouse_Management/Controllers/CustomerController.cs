using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Customer")]
    public class CustomerController : ControllerBase
    {
        private ProjectContext context;

        public CustomerController(ProjectContext _context)
        {
            context = _context;
        }

        // Create a new Customer
        [HttpPost("AddCustomer")]
        public void AddCustomer(Customer c)
        {
            context.customers.Add(c);
            context.SaveChanges();
        }

        // Update a Customer (full update)
        [HttpPut("UpdateCustomer")]
        public void UpdateCustomer(int id, string name, string phone, string email, string location)
        {
            Customer customer = context.customers.FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {

            }
            else
            {
                customer.Name = name;
                customer.Phone = phone;
                customer.Email = email;
                customer.Location = location;

                context.SaveChanges();
            }
        }

        // Update only the Customer location
        [HttpPatch("UpdateCustomerLocation")]
        public void UpdateCustomerLocation(int id, string location)
        {
            Customer customer = context.customers.FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {

            }
            else
            {
                customer.Location = location;
                context.SaveChanges();
            }
        }

        // Delete a Customer
        [HttpDelete("DeleteCustomer")]
        public void DeleteCustomer(int id)
        {
            Customer customer = context.customers.FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {

            }
            else
            {
                context.customers.Remove(customer);
                context.SaveChanges();
            }
        }

        // Get all Customers, including their related SalesOrders
        [HttpGet("GetCustomers")]
        public List<Customer> GetCustomers()
        {
            List<Customer> customers = context.customers
                .Include(c => c.salesOrders)
                .ToList();

            return customers;
        }

        // Get a single Customer by id
        [HttpGet("GetCustomer")]
        public Customer GetCustomer(int id)
        {
            Customer customer = context.customers.FirstOrDefault(c => c.CustomerId == id);

            return customer;
        }

        // Filter Customers by name
        [HttpGet("FilterCustomersName")]
        public List<Customer> FilterCustomersName(string name)
        {
            List<Customer> customers = context.customers.Where(c => c.Name.Contains(name)).Include(c => c.Name).ToList();
            return customers;
        }

        // Sort Customers by number of SalesOrders
        [HttpGet("SortCustomersByNumOfSalesOrders")]
        public List<Customer> SortCustomersByNumOfSalesOrders()
        {
            List<Customer> customers = context.customers
                .OrderBy(c => c.salesOrders.Count())
                .ToList();

            return customers;
        }
    }
}
