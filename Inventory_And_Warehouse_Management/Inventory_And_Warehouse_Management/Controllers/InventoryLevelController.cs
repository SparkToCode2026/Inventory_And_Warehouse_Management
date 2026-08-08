using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Inventory_And_Warehouse_Management.Services;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("InventoryLevel")]
    [Authorize]
    public class InventoryLevelController: ControllerBase
    {
        private ProjectContext Context;
        private readonly IEmailService emailService;

        public InventoryLevelController(ProjectContext _context, IEmailService _emailService)
        {
            Context = _context;
            emailService = _emailService;
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
        public async Task<IActionResult> UpdateInventoryLevel(int warehouseId, int productId, int quantityOnHand, int reorderThreshold)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.Include(il => il.product).Include(il => il.warehouse).FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {
                return NotFound("InventoryLevel for Warehouse " + warehouseId + " and Product " + productId + " does not exist.");
            }
            else
            {
                inventoryLevel.QuantityOnHand = quantityOnHand;
                inventoryLevel.ReorderThreshold = reorderThreshold;
                Context.SaveChanges();
                
                List<User> managers = Context.users.Where(u => u.Role == "Manager").ToList();
                foreach (User manager in managers)
                {
                    await emailService.SendEmailAsync(
                    manager.Email,
                    "Low Stock Alert",
                    $"Product {inventoryLevel.product.Name} at Warehouse {inventoryLevel.warehouse.Name} is low on stock: " +
                    $"{inventoryLevel.QuantityOnHand} units remaining (threshold: {inventoryLevel.ReorderThreshold})"
                    );
                }

                return Ok(inventoryLevel);
            }
            
        }


        //Case3: A second distinct update case (adjust quantity up or down)
        [HttpPatch("AdjustQuantity")]
        public async Task<IActionResult> AdjustQuantity(int warehouseId, int productId, int delta)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.Include(il => il.product).Include(il => il.warehouse).FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);
            if (inventoryLevel == null)
            {
                return NotFound("InventoryLevel for Warehouse " + warehouseId + " and Product " + productId + " does not exist.");
            }
            else
            {
                int newQuantity = inventoryLevel.QuantityOnHand + delta;
                if (newQuantity < 0)
                {
                return BadRequest("Adjustment would result in negative stock.");
                }
                
            inventoryLevel.QuantityOnHand = newQuantity;
            Context.SaveChanges();
            List<User> managers = Context.users.Where(u => u.Role == "Manager").ToList();
                foreach (User manager in managers)
                {
                    await emailService.SendEmailAsync(
                    manager.Email,
                    "Low Stock Alert",
                    $"Product {inventoryLevel.product.Name} at Warehouse {inventoryLevel.warehouse.Name} is low on stock: " +
                    $"{inventoryLevel.QuantityOnHand} units remaining (threshold: {inventoryLevel.ReorderThreshold})"
                    );
                }

            
            return Ok(inventoryLevel);
            }
        }



        //Case4: Delete an InventoryLevel record
        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("DeleteInventoryLevel")]
        public IActionResult DeleteInventoryLevel(int warehouseId, int productId)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {
                return NotFound("InventoryLevel for Warehouse " + warehouseId + " and Product " + productId + " does not exist.");
            }
            else
            {
                Context.InventoryLevels.Remove(inventoryLevel);
                Context.SaveChanges();
                return Ok("InventoryLevel deleted successfully.");
            }
        }


        //Case5: Get all InventoryLevels, including related Warehouse and Product
        [HttpGet("GetInventoryLevels")]
        public IActionResult GetInventoryLevels()
        {
            List<InventoryLevel> inventoryLevels = Context.InventoryLevels.Include(il => il.warehouse).Include(il => il.product).ToList();
            return Ok(inventoryLevels);
        }



        //Case6: Get a single InventoryLevel by composite key (WarehouseId + ProductId)
        [HttpGet("GetInventoryLevel")]
        public IActionResult GetInventoryLevel(int warehouseId, int productId)
        {
            InventoryLevel inventoryLevel = Context.InventoryLevels.Include(il => il.warehouse)
                .Include(il => il.product)
                .FirstOrDefault(il => il.WarehouseId == warehouseId && il.ProductId == productId);

            if (inventoryLevel == null)
            {
            return NotFound("InventoryLevel for Warehouse " + warehouseId + " / Product " + productId + " was not found.");
            }
            return Ok(inventoryLevel);
        }

        //Case7: Filter InventoryLevels where QuantityOnHand is below ReorderThreshold (low stock)
        [HttpGet("GetLowStock")]
        public async Task<IActionResult> GetLowStock()
        {
            List<InventoryLevel> inventoryLevels = Context.InventoryLevels.Include(il => il.warehouse).Include(il => il.product).Where(il => il.QuantityOnHand < il.ReorderThreshold).ToList();
            return Ok(inventoryLevels);
        }

        //Case8: Sort total QuantityOnHand per Product across all warehouses
        [HttpGet("GetTotalQuantityByProduct")]
        public IActionResult GetTotalQuantityByProduct()
        {
            List<object> totals = Context.InventoryLevels.GroupBy(il => il.ProductId).Select(g => new
                {
                    ProductId = g.Key,
                    TotalQuantityOnHand = g.Sum(il => il.QuantityOnHand)
                })
                .OrderByDescending(t => t.TotalQuantityOnHand)
                .ToList<object>();
            return Ok(totals);
        }

    }



}
