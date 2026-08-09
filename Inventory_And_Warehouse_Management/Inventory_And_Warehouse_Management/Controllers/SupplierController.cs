using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Supplier")]
    [Authorize(Roles = "Manager,Admin")]
    public class SupplierController : ControllerBase
    {
        private ProjectContext context;

        public SupplierController(ProjectContext _context)
        {
            context = _context;
        }

        // Create a new Supplier
        [HttpPost("AddSupplier")]
        public IActionResult AddSupplier(Supplier supplier)
        {
            bool emailExists = context.suppliers.Any(s => s.Email == supplier.Email);

            if (emailExists)
            {
                return BadRequest("Email already exists");
            }

            bool phoneExists = context.suppliers.Any(s => s.Phone == supplier.Phone);

            if (phoneExists)
            {
                return BadRequest("Phone number already exists");
            }
            context.suppliers.Add(supplier);
            context.SaveChanges();

            return Ok();
        }

        // Update a Supplier (full update)
        [HttpPut("UpdateSupplier")]
        public IActionResult UpdateSupplier(int id, string name, string phone, string email)
            
        {
            Supplier supplier = context.suppliers
                .FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found");
            }
            else
            {
                supplier.Name = name;
                supplier.Phone = phone;
                supplier.Email = email;

                context.SaveChanges();

                return Ok("Update successfully");
            }
        }

        // Update only the Supplier email
        [HttpPatch("UpdateSupplierEmail")]
        public IActionResult UpdateSupplierEmail(int id, string email)
        {
            Supplier supplier = context.suppliers
                .FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found");
            }
            else
            {
                supplier.Email = email;

                context.SaveChanges();

                return Ok("Update successfully");
            }
        }

        // Delete a Supplier
        [HttpDelete("DeleteSupplier")]
        public IActionResult DeleteSupplier(int id)
        {
            Supplier supplier = context.suppliers
                .FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found");
            }
            else
            {
                context.suppliers.Remove(supplier);
                context.SaveChanges();

                return Ok("Delete successfully");
            }
        }

        // Get all Suppliers, including their related PurchaseOrders
        [HttpGet("GetAllSuppliers")]
        public IActionResult GetAllSuppliers()
        {
            List<Supplier> suppliers = context.suppliers
                .Include(s => s.PurchaseOrders)
                .ToList();

            if (suppliers.Count == 0)
            {
                return NotFound("There are no suppliers");
            }

            return Ok(suppliers);
        }

        // Get a single Supplier by id
        [HttpGet("GetSupplier")]
        public IActionResult GetSupplier(int id)
        {
            Supplier supplier = context.suppliers
                .FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            {
                return NotFound("Supplier not found");
            }

            return Ok(supplier);
        }

        // Filter Suppliers by name
        [HttpGet("FilterSuppliersByName")]
        public IActionResult FilterSuppliersByName(string name)
        {
            List<Supplier> suppliers = context.suppliers
                .Where(s => s.Name.Contains(name))
                .ToList();

            if (suppliers.Count == 0)
            {
                return NotFound("Suppliers not found");
            }

            return Ok(suppliers);
        }

        // Filter Suppliers by email
        [HttpGet("FilterSuppliersByEmail")]
        public IActionResult FilterSuppliersByEmail(string email)
        {
            List<Supplier> suppliers = context.suppliers
                .Where(s => s.Email.Contains(email))
                .ToList();

            if (suppliers.Count == 0)
            {
                return NotFound("Suppliers not found");
            }

            return Ok(suppliers);
        }

        // Sort Suppliers by number of PurchaseOrders
        [HttpGet("SortSuppliersByNumOfPurchaseOrders")]
        public IActionResult SortSuppliersByNumOfPurchaseOrders()
        {
            List<Supplier> suppliers = context.suppliers
                .Include(s => s.PurchaseOrders)
                .OrderBy(s => s.PurchaseOrders.Count())
                .ToList();

            if (suppliers.Count == 0)
            {
                return NotFound("There are no suppliers");
            }

            return Ok(suppliers);
        }

    }
}
