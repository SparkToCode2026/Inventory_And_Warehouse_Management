using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;
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
        public void AddInventoryLevel(InventoryLevel il)
        {
            Context.InventoryLevels.Add(il);
            Context.SaveChanges();
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





    }



}
