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

        //Case2:Update a Warehouse (full update)
        [HttpPut("UpdateWarehouse")]
        public void UpdateWarehouse(int id, string name, int capacity, string location, string phone)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {

            }
            else
            {
                warehouse.Name = name;
                warehouse.Capacity = capacity;
                warehouse.Location = location;
                warehouse.Phone = phone;
                context.SaveChanges();
            }
        }
    }
}
