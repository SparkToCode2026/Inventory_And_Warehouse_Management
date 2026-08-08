using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("InventoryLevel")]
    public class InventoryLevelController: ControllerBase
    {
        private ProjectContext Context;
        public InventoryLevelController(ProjectContext _context)
        {
            Context = _context;
        }


        //Case1: Create a new InventoryLevel record
        [HttpPost("AddInventoryLevel")]
        public IActionResult AddInventoryLevel(InventoryLevel il)
        {

            //Validation
            bool warehouseExists = Context.warehouses.Any(w => w.WarehouseId == il.WarehouseId);
            if (!warehouseExists)
            {
                return BadRequest("Warehouse " + il.WarehouseId + " does not exist.");
            }

            bool productExists = Context.products.Any(p => p.ProductId == il.ProductId);
            if (!productExists)
            {
                return BadRequest("Product " + il.ProductId + " does not exist.");
            }

            bool duplicate = Context.InventoryLevels.Any(x => x.WarehouseId == il.WarehouseId && x.ProductId == il.ProductId);
            if (duplicate)
            {
                return BadRequest("An InventoryLevel for this Warehouse/Product combination already exists.");
            }

            if (il.QuantityOnHand < 0 || il.ReorderThreshold < 0)
            {
                return BadRequest("QuantityOnHand and ReorderThreshold cannot be negative.");
            }

            Context.InventoryLevels.Add(il);
            Context.SaveChanges();

            return Ok(il);
        }


        //Case2: Update an InventoryLevel (full update)
        [HttpPut("UpdateInventoryLevel")]
        public void UpdateInventoryLevel(int warehouseId, int productId, int quantityOnHand, int reorderThreshold)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {

            }
            else
            {
                inventoryLevel.QuantityOnHand = quantityOnHand;
                inventoryLevel.ReorderThreshold = reorderThreshold;
                Context.SaveChanges();
            }
        }


        //Case3: A second distinct update case (adjust quantity up or down)
        [HttpPatch("AdjustQuantity")]
        public void AdjustQuantity(int warehouseId, int productId, int delta)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {

            }
            else
            {
                inventoryLevel.QuantityOnHand = inventoryLevel.QuantityOnHand + delta;
                Context.SaveChanges();
            }
        }



        //Case4: Delete an InventoryLevel record
        [HttpDelete("DeleteInventoryLevel")]
        public void DeleteInventoryLevel(int warehouseId, int productId)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {

            }
            else
            {
                Context.InventoryLevels.Remove(inventoryLevel);
                Context.SaveChanges();
            }
        }


        //Case5: Get all InventoryLevels, including related Warehouse and Product
        [HttpGet("GetInventoryLevels")]
        public List<InventoryLevel> GetInventoryLevels()
        {
            List<InventoryLevel> inventoryLevels = Context.InventoryLevels.Include(il => il.warehouse).Include(il => il.product).ToList();
            return inventoryLevels;
        }



        //Case6: Get a single InventoryLevel by composite key (WarehouseId + ProductId)
        [HttpGet("GetInventoryLevel")]
        public InventoryLevel GetInventoryLevel(int warehouseId, int productId)
        {
            InventoryLevel InventoryLevels = Context.InventoryLevels.Include(il => il.warehouse).Include(il => il.product).FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);
            return InventoryLevels;
        }

        //Case7: Filter InventoryLevels where QuantityOnHand is below ReorderThreshold (low stock)
        [HttpGet("GetLowStock")]
        public List<InventoryLevel> GetLowStock()
        {
            List<InventoryLevel> InventoryLevels = Context.InventoryLevels.Include(il => il.warehouse).Include(il => il.product).Where(il => il.QuantityOnHand < il.ReorderThreshold).ToList();
            return InventoryLevels;
        }

        //Case8: Sort total QuantityOnHand per Product across all warehouses
        [HttpGet("GetTotalQuantityByProduct")]
        public List<object> GetTotalQuantityByProduct()
        {
            List<object> totals = Context.InventoryLevels.GroupBy(il => il.ProductId).Select(g => new
                {
                    ProductId = g.Key,
                    TotalQuantityOnHand = g.Sum(il => il.QuantityOnHand)
                })
                .OrderByDescending(t => t.TotalQuantityOnHand)
                .ToList<object>();
            return totals;
        }

    }



}
