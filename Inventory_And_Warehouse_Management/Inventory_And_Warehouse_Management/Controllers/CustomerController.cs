using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize]
        [HttpPost("AddCustomer")]
        public IActionResult AddCustomer(Customer customer)
        {

            bool emailExists = context.customers.Any(c => c.Email == customer.Email);
            

            if (emailExists)
            {
                return BadRequest("Email already exists");
            }

            bool phoneExists = context.customers.Any(c => c.Phone == customer.Phone);

            if (phoneExists)
            {
                return BadRequest("Phone number already exists");
            }
            context.customers.Add(customer);
            context.SaveChanges();

            return Ok();
        }

        // Update a Customer (full update)
        [Authorize]
        [HttpPut("UpdateCustomer")]
        public IActionResult UpdateCustomer(int id, string name, string phone, string email, string location)
           
        {
            Customer customer = context.customers
                .FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {
                return NotFound("Customer not found");
            }
            else
            {
                customer.Name = name;
                customer.Phone = phone;
                customer.Email = email;
                customer.Location = location;

                context.SaveChanges();

                return Ok("Update successfully");
            }
        }

        // Update only the Customer location
        [Authorize]
        [HttpPatch("UpdateCustomerLocation")]
        public IActionResult UpdateCustomerLocation(int id, string location)
        {
            Customer customer = context.customers
                .FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {
                return NotFound("Customer not found");
            }
            else
            {
                customer.Location = location;

                context.SaveChanges();

                return Ok("Update successfully");
            }
        }

        // Delete a Customer
        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("DeleteCustomer")]
        public IActionResult DeleteCustomer(int id)
        {
            Customer customer = context.customers
                .FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {
                return NotFound("Customer not found");
            }
            else
            {
                context.customers.Remove(customer);
                context.SaveChanges();

                return Ok("Delete successfully");
            }
        }

        // Get all Customers, including their related SalesOrders
        [Authorize]
        [HttpGet("GetAllCustomers")]
        public IActionResult GetAllCustomers()
        {
            List<Customer> customers = context.customers
                .Include(c => c.salesOrders)
                .ToList();

            if (customers.Count == 0)
            {
                return NotFound("There are no customers");
            }

            return Ok(customers);
        }

        // Get a single Customer by id
        [Authorize]
        [HttpGet("GetCustomer")]
        public IActionResult GetCustomer(int id)
        {
            Customer customer = context.customers
                .FirstOrDefault(c => c.CustomerId == id);

            if (customer == null)
            {
                return NotFound("Customer not found");
            }

            return Ok(customer);
        }

        // Filter Customers by name
        [Authorize]
        [HttpGet("FilterCustomersByName")]
        public IActionResult FilterCustomersByName(string name)
        {
            List<Customer> customers = context.customers
                .Where(c => c.Name.Contains(name))
                .ToList();

            if (customers.Count == 0)
            {
                return NotFound("Customers not found");
            }

            return Ok(customers);
        }

        // Filter Customers by location
        [Authorize]
        [HttpGet("FilterCustomersByLocation")]
        public IActionResult FilterCustomersByLocation(string location)
        {
            List<Customer> customers = context.customers
                .Where(c => c.Location.Contains(location))
                .ToList();

            if (customers.Count == 0)
            {
                return NotFound("Customers not found");
            }

            return Ok(customers);
        }

        // Sort Customers by number of SalesOrders
        [Authorize]
        [HttpGet("SortCustomersByNumOfSalesOrders")]
        public IActionResult SortCustomersByNumOfSalesOrders()
        {
            List<Customer> customers = context.customers
                .Include(c => c.salesOrders)
                .OrderBy(c => c.salesOrders.Count())
                .ToList();

            if (customers.Count == 0)
            {
                return NotFound("There are no customers");
            }

            return Ok(customers);
        }
    }
}
