using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Warehouse")]
    public class WarehouseController : ControllerBase
    {
        private ProjectContext context;

        public WarehouseController (ProjectContext _context)
        {
            context = _context;
        }

        //Case1: Create a new Warehouse
        [HttpPost("AddWarehouse")]
        public void AddWarehouse(Warehouse w)
        {
            context.warehouses.Add(w);
            context.SaveChanges();
        }
    }
}
