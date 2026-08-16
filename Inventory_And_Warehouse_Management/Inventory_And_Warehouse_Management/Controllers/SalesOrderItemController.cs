using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("SalesOrderItem")]
    [Authorize]
    public class SalesOrderItemController : ControllerBase
    {
        private ProjectContext context;

        public SalesOrderItemController(ProjectContext _context)
        {
            context = _context;
        }


        // 1. Create SalesOrderItem
        [HttpPost("AddSalesOrderItem")]
        public IActionResult AddSalesOrderItem(SalesOrderItem item)
        {
            if (item == null)
            {
                return BadRequest("Invalid data");
            }

            item.TotalPrice = item.Quantity * item.UnitPrice;

            item.salesOrder = null;
            item.product = null;

            context.salesOrderItems.Add(item);

            context.SaveChanges();


            // Update parent SalesOrder TotalAmount
            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == item.SalesOrderId);


            if (order != null)
            {
                order.TotalAmount += item.TotalPrice;
                context.SaveChanges();
            }


            return Ok(item.SalesOrderItemId);
        }



        // 2. Full Update SalesOrderItem
        [HttpPut("UpdateSalesOrderItem")]
        public IActionResult UpdateSalesOrderItem(int id, SalesOrderItem newItem)
        {
            SalesOrderItem item = context.salesOrderItems
                .FirstOrDefault(i => i.SalesOrderItemId == id);

            if (item == null)
            {
                return NotFound("Item not found");
            }

            bool keyChanged = item.SalesOrderId != newItem.SalesOrderId || item.ProductId != newItem.ProductId;

            bool conflict = context.salesOrderItems.Any(i =>
                i.SalesOrderItemId != id &&
                i.SalesOrderId == newItem.SalesOrderId &&
                i.ProductId == newItem.ProductId);

            if (conflict)
            {
                return BadRequest("Another item already exists for that Sales Order and Product combination.");
            }

            decimal oldTotalPrice = item.TotalPrice;
            int oldSalesOrderId = item.SalesOrderId;
            decimal newTotalPrice = newItem.Quantity * newItem.UnitPrice;

            if (keyChanged)
            {
                // Can't modify a composite key in place - delete old row, insert a new one
                context.salesOrderItems.Remove(item);

                SalesOrderItem replacement = new SalesOrderItem
                {
                    SalesOrderId = newItem.SalesOrderId,
                    ProductId = newItem.ProductId,
                    Quantity = newItem.Quantity,
                    UnitPrice = newItem.UnitPrice,
                    TotalPrice = newTotalPrice
                };
                context.salesOrderItems.Add(replacement);
            }
            else
            {
                item.Quantity = newItem.Quantity;
                item.UnitPrice = newItem.UnitPrice;
                item.TotalPrice = newTotalPrice;
            }

            // Fix the SalesOrder total(s)
            if (oldSalesOrderId != newItem.SalesOrderId)
            {
                SalesOrder oldOrder = context.salesOrders.FirstOrDefault(o => o.SalesOrderId == oldSalesOrderId);
                if (oldOrder != null) oldOrder.TotalAmount -= oldTotalPrice;

                SalesOrder newOrder = context.salesOrders.FirstOrDefault(o => o.SalesOrderId == newItem.SalesOrderId);
                if (newOrder != null) newOrder.TotalAmount += newTotalPrice;
            }
            else
            {
                SalesOrder order = context.salesOrders.FirstOrDefault(o => o.SalesOrderId == newItem.SalesOrderId);
                if (order != null) order.TotalAmount = order.TotalAmount - oldTotalPrice + newTotalPrice;
            }

            context.SaveChanges();

            return Ok();
        }


        // 3. Update Quantity only
        [HttpPatch("UpdateQuantity")]
        public IActionResult UpdateQuantity(int id, int newQuantity)
        {
            SalesOrderItem item = context.salesOrderItems
                .FirstOrDefault(i => i.SalesOrderItemId == id);


            if (item == null)
            {
                return NotFound("Item not found");
            }
            decimal oldTotalPrice = item.TotalPrice;

            item.Quantity = newQuantity;
            item.TotalPrice = item.Quantity * item.UnitPrice;

            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == item.SalesOrderId);
            if (order != null)
            {
                order.TotalAmount = order.TotalAmount - oldTotalPrice + item.TotalPrice;
            }

            context.SaveChanges();

            return Ok();
        }



        // 4. Delete SalesOrderItem
        [HttpDelete("RemoveSalesOrderItem")]
        public IActionResult RemoveSalesOrderItem(int id)
        {
            SalesOrderItem item = context.salesOrderItems
                .FirstOrDefault(i => i.SalesOrderItemId == id);


            if (item == null)
            {
                return NotFound("Item not found");
            }

            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == item.SalesOrderId);

            if (order != null) {
                order.TotalAmount -= item.TotalPrice;
            }

            context.salesOrderItems.Remove(item);

            context.SaveChanges();

            return Ok("removed successfully");
        }




        // 5. Get All SalesOrderItems with SalesOrder and Product
        [HttpGet("GetALLSalesOrderItems")]
        public IActionResult GetALLSalesOrderItems()
        {
            List<SalesOrderItem> items = context.salesOrderItems
                .Include(i => i.salesOrder)
                .Include(i => i.product)
                .ToList();


            return Ok(items);
        }


        // 6. Get by Composite Key
        // SalesOrderId + ProductId
        [HttpGet("GetSalesOrderItem")]
        public IActionResult GetSalesOrderItem(int salesOrderId, int productId)
        {
            SalesOrderItem item = context.salesOrderItems
                .FirstOrDefault(i =>
                    i.SalesOrderId == salesOrderId &&
                    i.ProductId == productId);


            if (item == null)
            {
                return NotFound("Item not found");
            }


            return Ok(item);
        }



        // 7. Filter by ProductId
        [HttpGet("GetByProduct")]
        public IActionResult GetByProduct(int productId)
        {
            List<SalesOrderItem> items = context.salesOrderItems
                .Where(i => i.ProductId == productId)
                .ToList();


            return Ok(items);
        }



        // 8. Sort by Quantity (Highest selling items)
        [HttpGet("SortByQuantity")]
        public IActionResult SortByQuantity()
        {
            List<SalesOrderItem> items = context.salesOrderItems
                .OrderByDescending(i => i.Quantity)
                .ToList();


            return Ok(items);
        }

    }
}
