using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;


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
        public IActionResult AddWarehouse(Warehouse w)
        {

            //Validation
            if (string.IsNullOrWhiteSpace(w.Name))
            {
                return BadRequest("Warehouse Name is required.");
            }

            if (w.Capacity < 0)
            {
                return BadRequest("Capacity cannot be negative.");
            }

            context.warehouses.Add(w);
            context.SaveChanges();

            return Ok(w);
        }

        //Case2:Update a Warehouse (full update)
        [HttpPut("UpdateWarehouse")]
        public IActionResult UpdateWarehouse(int id, string name, int capacity, string location, string phone)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {
                return NotFound("Warehouse " + id + " was not found.");
            }
            else
            {
                warehouse.Name = name;
                warehouse.Capacity = capacity;
                warehouse.Location = location;
                warehouse.Phone = phone;
                context.SaveChanges();

                return Ok(warehouse);
            }
        }


        //Case3: A second distinct update case 
        [HttpPatch("UpdateWarehouseContact")]
        public IActionResult UpdateWarehouseContact(int id, string location, string phone)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {
                return NotFound("Warehouse " + id + " was not found.");

            }
            else
            {
                warehouse.Location = location;
                warehouse.Phone = phone;
                context.SaveChanges();

                return Ok(warehouse);
            }
        }


        //Case4: Delete a Warehouse
        [HttpDelete("DeleteWarehouse")]
        public IActionResult DeleteWarehouse(int id)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);

            if (warehouse == null)
            {
                return NotFound("Warehouse " + id + " was not found.");
            }
            else
            {
                context.warehouses.Remove(warehouse);
                context.SaveChanges();
                return Ok();
            }
        }

        //Case5:Get All Warehouses with Related Inventory Data
        [HttpGet("GetWarehouses")]
        public IActionResult GetWarehouses()
        {
            List<Warehouse> Warehouses = context.warehouses.Include(w => w.inventoryLevels).ToList();
            return Ok(Warehouses);
        }

        //Case6: Get a single Warehouse by id
        [HttpGet("GetWarehouse")]
        public IActionResult GetWarehouse(int id)
        {
            Warehouse warehouse = context.warehouses.FirstOrDefault(w => w.WarehouseId == id);
            if (warehouse == null)
            {
                return NotFound("Warehouse " + id + " was not found.");
            }
            return Ok(warehouse);
        }

        //Case7: Filter Warehouses by location
        [HttpGet("FilterWarehousesByLocation")]
        public IActionResult FilterWarehousesByLocation(string location)
        {
            List<Warehouse> warehouses = context.warehouses.Where(w => w.Location.Contains(location)).Include(w => w.inventoryLevels).ToList();
            return Ok(warehouses);
        }

        //Case8: Sort Warehouses by total used capacity
        [HttpGet("SortWarehousesByUsedCapacity")]
        public IActionResult SortWarehousesByUsedCapacity()
        {
            List<Warehouse> warehouses = context.warehouses
                .Include(w => w.inventoryLevels)
                .OrderByDescending(w => w.inventoryLevels.Sum(il => il.QuantityOnHand))
                .ToList();
            return Ok(warehouses);
        }

    }
}
