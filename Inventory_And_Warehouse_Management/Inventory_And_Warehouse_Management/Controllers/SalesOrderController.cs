using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Inventory_And_Warehouse_Management.Models;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("SalesOrder")]
    public class SalesOrderController : ControllerBase
    {
        private ProjectContext context;

        public SalesOrderController(ProjectContext _context)
        {
            context = _context;
        }


        // 1. Create Sales Order with validation
        [HttpPost("AddSalesOrder")]
        public IActionResult AddSalesOrder(SalesOrder order)
        {
            if (order == null)
            {
                return BadRequest("Invalid data");
            }

            context.salesOrders.Add(order);
            context.SaveChanges();

            return Ok(order.SalesOrderId);
        }



        // 2. Full Update Sales Order
        [HttpPut("UpdateSalesOrder")]
        public IActionResult UpdateSalesOrder(int id, SalesOrder newOrder)
        {
            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == id);

            if (order == null)
            {
                return NotFound("Sales Order not found");
            }

            order.CustomerId = newOrder.CustomerId;
            order.UserId = newOrder.UserId;
            order.OrderDate = newOrder.OrderDate;
            order.TotalAmount = newOrder.TotalAmount;
            order.Status = newOrder.Status;

            context.SaveChanges();

            return Ok();
        }



        // 3. Update Status only
        [HttpPatch("UpdateStatus")]
        public IActionResult UpdateStatus(int id, string status)
        {
            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == id);

            if (order == null)
            {
                return NotFound("Sales Order not found");
            }

            order.Status = status;

            context.SaveChanges();

            return Ok("Status updated");
        }



        // 4. Delete Sales Order
        [HttpDelete("RemoveSalesOrder")]
        public IActionResult RemoveSalesOrder(int id)
        {
            SalesOrder order = context.salesOrders
                .FirstOrDefault(o => o.SalesOrderId == id);

            if (order == null)
            {
                return NotFound("Sales Order not found");
            }

            context.salesOrders.Remove(order);
            context.SaveChanges();

            return Ok("Removed successfully");
        }



        // 5. Get All Sales Orders with Customer and Items
        [HttpGet("GetALLSalesOrders")]
        public IActionResult GetALLSalesOrders()
        {
            List<SalesOrder> orders = context.salesOrders
                .Include(o => o.customer)
                .Include(o => o.salesOrderItems)
                .ToList();

            return Ok(orders);
        }



        // 6. Get Sales Order by Id
        [HttpGet("GetSalesOrder")]
        public IActionResult GetSalesOrder(int id)
        {
            SalesOrder order = context.salesOrders
                .Include(o => o.customer)
                .Include(o => o.salesOrderItems)
                .FirstOrDefault(o => o.SalesOrderId == id);


            if (order == null)
            {
                return NotFound("Sales Order not found");
            }

            return Ok(order);
        }



        // 7. Filter by Status
        [HttpGet("FilterByStatus")]
        public IActionResult FilterByStatus(string status)
        {
            List<SalesOrder> orders = context.salesOrders
                .Where(o => o.Status.Contains(status))
                .ToList();

            return Ok(orders);
        }



        // 8. Sort Sales Orders by Total Amount (Highest first)
        [HttpGet("SortByTotalAmount")]
        public IActionResult SortByTotalAmount()
        {
            List<SalesOrder> orders = context.salesOrders
                .OrderByDescending(o => o.TotalAmount)
                .ToList();

            return Ok(orders);
        }

    }
}
