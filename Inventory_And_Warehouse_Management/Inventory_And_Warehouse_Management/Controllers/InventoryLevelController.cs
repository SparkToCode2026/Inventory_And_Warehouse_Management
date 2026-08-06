using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using System;

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
            context.inventoryLevels.Add(il);
            context.SaveChanges();
        }


        //Case2: Update an InventoryLevel (full update)
        [HttpPut("UpdateInventoryLevel")]
        public void UpdateInventoryLevel(int warehouseId, int productId, int quantityOnHand, int reorderThreshold)
        {
            InventoryLevel inventoryLevel = context.inventoryLevels
                .FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {

            }
            else
            {
                inventoryLevel.QuantityOnHand = quantityOnHand;
                inventoryLevel.ReorderThreshold = reorderThreshold;
                context.SaveChanges();
            }
        }


        //Case3: A second distinct update case (adjust quantity up or down)
        [HttpPatch("AdjustQuantity")]
        public void AdjustQuantity(int warehouseId, int productId, int delta)
        {
            InventoryLevel inventoryLevel = context.inventoryLevels
                .FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {

            }
            else
            {
                inventoryLevel.QuantityOnHand = inventoryLevel.QuantityOnHand + delta;
                context.SaveChanges();
            }
        }





    }



}
