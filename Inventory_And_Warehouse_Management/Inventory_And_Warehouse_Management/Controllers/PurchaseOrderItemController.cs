using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("PurchaseOrderItem")]
    [Authorize]
    public class PurchaseOrderItemController : ControllerBase
    {
        private ProjectContext context;

        public PurchaseOrderItemController(ProjectContext _context)
        {
            context = _context;
        }

        //Create a new PurchaseOrderItem (and update the parent PurchaseOrder's TotalAmount)
        [HttpPost("AddPurchaseOrderItem")]
        public IActionResult AddPurchaseOrderItem(PurchaseOrderItem item)
        {
            PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

            if (parentOrder == null)
            {
                return BadRequest($"PurchaseOrder with id {item.PurchaseOrderId} does not exist.");
            }

            item.TotalPrice = item.Quantity * item.UnitPrice;

            context.purchaseOrderItems.Add(item);

            parentOrder.TotalAmount += item.TotalPrice;

            context.SaveChanges();

            return Ok(item);
        }

        //Update a PurchaseOrderItem (full update)
        [HttpPut("UpdatePurchaseOrderItem")]
        public IActionResult UpdatePurchaseOrderItem(int id, int purchaseOrderId, int productId, int quantity, decimal unitPrice)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {
                return NotFound($"PurchaseOrderItem with id {id} not found.");
            }

            PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

            if (parentOrder != null)
            {
                parentOrder.TotalAmount -= item.TotalPrice;
            }

            item.PurchaseOrderId = purchaseOrderId;
            item.ProductId = productId;
            item.Quantity = quantity;
            item.UnitPrice = unitPrice;
            item.TotalPrice = quantity * unitPrice;

            if (parentOrder != null)
            {
                parentOrder.TotalAmount += item.TotalPrice;
            }

            context.SaveChanges();

            return Ok(item);
        }

        //A second distinct update case (update Quantity only)
        [HttpPatch("UpdatePurchaseOrderItemQuantity")]
        public IActionResult UpdatePurchaseOrderItemQuantity(int id, int quantity)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {
                return NotFound($"PurchaseOrderItem with id {id} not found.");
            }

            PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

            if (parentOrder != null)
            {
                parentOrder.TotalAmount -= item.TotalPrice;
            }

            item.Quantity = quantity;
            item.TotalPrice = item.Quantity * item.UnitPrice;

            if (parentOrder != null)
            {
                parentOrder.TotalAmount += item.TotalPrice;
            }

            context.SaveChanges();

            return Ok(item);
        }

        //Delete a PurchaseOrderItem
        [HttpDelete("DeletePurchaseOrderItem")]
        public IActionResult DeletePurchaseOrderItem(int id)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {
                return NotFound($"PurchaseOrderItem with id {id} not found.");
            }

            PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

            if (parentOrder != null)
            {
                parentOrder.TotalAmount -= item.TotalPrice;
            }

            context.purchaseOrderItems.Remove(item);
            context.SaveChanges();

            return Ok($"PurchaseOrderItem with id {id} deleted successfully.");
        }

        //Get all PurchaseOrderItems, including related PurchaseOrder and Product
        [HttpGet("GetPurchaseOrderItems")]
        public IActionResult GetPurchaseOrderItems()
        {
            List<PurchaseOrderItem> items = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Include(i => i.product)
                .ToList();

            return Ok(items);
        }

        //Get by id (composite key - matching both PurchaseOrderId and ProductId)
        [HttpGet("GetPurchaseOrderItem")]
        public IActionResult GetPurchaseOrderItem(int purchaseOrderId, int productId)
        {
            PurchaseOrderItem item = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Include(i => i.product)
                .FirstOrDefault(i => i.PurchaseOrderId == purchaseOrderId && i.ProductId == productId);

            if (item == null)
            {
                return NotFound($"No item found for PurchaseOrderId {purchaseOrderId} and ProductId {productId}.");
            }

            return Ok(item);
        }

        //Filter PurchaseOrderItems by product id
        [HttpGet("PurchaseOrderItemsByProduct")]
        public IActionResult PurchaseOrderItemsByProduct(int productId)
        {
            List<PurchaseOrderItem> items = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Where(i => i.ProductId == productId)
                .ToList();

            return Ok(items);
        }

        //Sort/aggregate: most-ordered products (sum of quantity grouped by product)
        [HttpGet("MostOrderedProducts")]
        public IActionResult MostOrderedProducts()
        {
            var result = context.purchaseOrderItems
                .Include(i => i.product)
                .GroupBy(i => new { i.ProductId, i.product.Name })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalQuantityOrdered = g.Sum(i => i.Quantity)
                })
                .OrderByDescending(x => x.TotalQuantityOrdered)
                .ToList();

            return Ok(result);
        }
    }
}