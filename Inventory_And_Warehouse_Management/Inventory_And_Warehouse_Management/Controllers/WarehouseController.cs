using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

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


        //Case3: A second distinct update case 
        [HttpPatch("UpdateWarehouseContact")]
        public void UpdateWarehouseContact(int id, string location, string phone)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {

            }
            else
            {
                warehouse.Location = location;
                warehouse.Phone = phone;
                context.SaveChanges();
            }
        }


        //Case4: Delete a Warehouse
        [HttpDelete("DeleteWarehouse")]
        public void DeleteWarehouse(int id)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {

            }
            else
            {
                context.warehouses.Remove(warehouse);
                context.SaveChanges();
            }
        }

        //Case5:Get All Warehouses with Related Inventory Data
        [HttpGet("GetInventoryLevels")]
        public List<InventoryLevel> GetInventoryLevels()
        {
            List<InventoryLevel> inventoryLevels = context.inventoryLevels.Include(il => il.warehouse).Include(il => il.product).ToList();
            return inventoryLevels;
        }

        //Case6: Get a single Warehouse by id
        [HttpGet("GetWarehouse")]
        public Warehouse GetWarehouse(int id)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);
            return warehouse;
        }


    }
}
