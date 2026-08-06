using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Supplier")]
    public class SupplierController : ControllerBase
    {
        private ProjectContext context;

        public SupplierController(ProjectContext _context)
        {
            context = _context;
        }

        // Create a new Supplier
        [HttpPost("AddSupplier")]
        public void AddSupplier(Supplier s)
        {
           context.suppliers.Add(s);
            context.SaveChanges();

        }

        // Update a Supplier (full update)
        [HttpPut("UpdateSupplier")]
        public void UpdateSupplierEmail(int id, string name, string phone,  string email)
        {
            Supplier supplier = context.suppliers.FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            { }
            else
            {
                supplier.Name = name;
                supplier.Phone = phone;
                supplier.Email = email;

                context.SaveChanges();
            }
        }


        // Update only the Supplier email
        [HttpPatch("UpdateSupplierEmail")]
        public void UpdateSupplier(int id, string email)

        {
            Supplier supplier = context.suppliers.FirstOrDefault(s => s.SupplierId == id);

            if (supplier == null)
            { }
            else
            {
             
                supplier.Email = email;

                context.SaveChanges();
            }
        }


        // Delete a Supplier
        [HttpDelete("DeleteSupplier")]
        public void RemoveSupplier(int id)
        {
            Supplier s = context.suppliers.FirstOrDefault(s => s.SupplierId == id);

            if (s == null)
            {

            }
            else
            {
                context.suppliers.Remove(s);
                context.SaveChanges();
            }
        }



        // Get all Suppliers, including their related PurchaseOrders
        [HttpGet("GetSuppliers")]
        public List<Supplier> GetAllSuppliers()
        {
            List<Supplier> suppliers = context.suppliers.ToList();
            return suppliers;
        }

        // Get a single Supplier by id
        [HttpGet("GetSupplier")]
        public Supplier GetSupplier(int id)
        {
            Supplier s = context.suppliers.FirstOrDefault(s => s.SupplierId == id);
            return s;

        }

        // Filter Suppliers by name
        [HttpGet("FilterSuppliersByName")]
        public List<Supplier> FilterSuppliersByName(string name)
        {
            List<Supplier> suppliers = context.suppliers.Where(s => s.Name.Contains(name)).Include(s => s.Name).ToList();
            return suppliers;
        }


        // Sort Suppliers by number of PurchaseOrders
        [HttpGet("SortSuppliersByNumOfPurchaseOrders")]
        public List<Supplier> SortSuppliersByNumOfPurchaseOrders()
        {
            List<Supplier> suppliers = context.suppliers.OrderBy(s => s.PurchaseOrders.Count()).ToList();
            return suppliers;
        }

    }
}
