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
        public void AddPurchaseOrderItem(PurchaseOrderItem item)
        {
            PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

            if (parentOrder == null)
            {

            }
            else
            {
                item.TotalPrice = item.Quantity * item.UnitPrice;

                context.purchaseOrderItems.Add(item);

                parentOrder.TotalAmount += item.TotalPrice;

                context.SaveChanges();
            }
        }

        //Update a PurchaseOrderItem (full update)
        [HttpPut("UpdatePurchaseOrderItem")]
        public void UpdatePurchaseOrderItem(int id, int purchaseOrderId, int productId, int quantity, decimal unitPrice)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {

            }
            else
            {
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
            }
        }

        //A second distinct update case (update Quantity only)
        [HttpPatch("UpdatePurchaseOrderItemQuantity")]
        public void UpdatePurchaseOrderItemQuantity(int id, int quantity)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {

            }
            else
            {
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
            }
        }

        //Delete a PurchaseOrderItem
        [HttpDelete("DeletePurchaseOrderItem")]
        public void DeletePurchaseOrderItem(int id)
        {
            PurchaseOrderItem item = context.purchaseOrderItems.FirstOrDefault(i => i.PurchaseOrderItemId == id);

            if (item == null)
            {

            }
            else
            {
                PurchaseOrder parentOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == item.PurchaseOrderId);

                if (parentOrder != null)
                {
                    parentOrder.TotalAmount -= item.TotalPrice;
                }

                context.purchaseOrderItems.Remove(item);
                context.SaveChanges();
            }
        }

        //Get all PurchaseOrderItems, including related PurchaseOrder and Product
        [HttpGet("GetPurchaseOrderItems")]
        public List<PurchaseOrderItem> GetPurchaseOrderItems()
        {
            List<PurchaseOrderItem> items = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Include(i => i.product)
                .ToList();

            return items;
        }

        //Get by id (composite key - matching both PurchaseOrderId and ProductId)
        [HttpGet("GetPurchaseOrderItem")]
        public PurchaseOrderItem GetPurchaseOrderItem(int purchaseOrderId, int productId)
        {
            PurchaseOrderItem item = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Include(i => i.product)
                .FirstOrDefault(i => i.PurchaseOrderId == purchaseOrderId && i.ProductId == productId);

            return item;
        }

        //Filter PurchaseOrderItems by product id
        [HttpGet("PurchaseOrderItemsByProduct")]
        public List<PurchaseOrderItem> PurchaseOrderItemsByProduct(int productId)
        {
            List<PurchaseOrderItem> items = context.purchaseOrderItems
                .Include(i => i.purchaseOrder)
                .Where(i => i.ProductId == productId)
                .ToList();

            return items;
        }

        //Sort/aggregate: most-ordered products (sum of quantity grouped by product)
        [HttpGet("MostOrderedProducts")]
        public List<object> MostOrderedProducts()
        {
            List<object> result = context.purchaseOrderItems
                .Include(i => i.product)
                .GroupBy(i => new { i.ProductId, i.product.Name })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    TotalQuantityOrdered = g.Sum(i => i.Quantity)
                })
                .OrderByDescending(x => x.TotalQuantityOrdered)
                .ToList<object>();

            return result;
        }
    }
}