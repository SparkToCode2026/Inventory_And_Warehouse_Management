using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("PurchaseOrder")]
    public class PurchaseOrderController : ControllerBase
    {
        private ProjectContext context;

        public PurchaseOrderController(ProjectContext _context)
        {
            context = _context;
        }

        //Create a new PurchaseOrder (with validation)
        [HttpPost("AddPurchaseOrder")]
        public IActionResult AddPurchaseOrder(PurchaseOrder po)
        {
            var allowedStatuses = new[] { "Pending", "Approved", "Received" };

            if (!allowedStatuses.Contains(po.Status))
            {
                return BadRequest("Status must be one of: Pending, Approved, Received.");
            }

            context.purchaseOrders.Add(po);
            context.SaveChanges();

            return Ok(po);
        }

        //Update a PurchaseOrder (full update)
        [HttpPut("UpdatePurchaseOrder")]
        public IActionResult UpdatePurchaseOrder(int id, string status, decimal totalAmount, DateTime orderDate, int supplierId, int userId)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound($"PurchaseOrder with id {id} not found.");
            }

            var allowedStatuses = new[] { "Pending", "Approved", "Received" };
            if (!allowedStatuses.Contains(status))
            {
                return BadRequest("Status must be one of: Pending, Approved, Received.");
            }

            purchaseOrder.Status = status;
            purchaseOrder.TotalAmount = totalAmount;
            purchaseOrder.OrderDate = orderDate;
            purchaseOrder.SupplierId = supplierId;
            purchaseOrder.UserId = userId;
            context.SaveChanges();

            return Ok(purchaseOrder);
        }

        //A second distinct update case (change Status only)
        [HttpPatch("UpdatePurchaseOrderStatus")]
        public IActionResult UpdatePurchaseOrderStatus(int id, string status)
        {
            var allowedStatuses = new[] { "Pending", "Approved", "Received" };
            if (!allowedStatuses.Contains(status))
            {
                return BadRequest("Status must be one of: Pending, Approved, Received.");
            }

            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound($"PurchaseOrder with id {id} not found.");
            }

            purchaseOrder.Status = status;
            context.SaveChanges();

            return Ok(purchaseOrder);
        }

        //Delete a PurchaseOrder
        [HttpDelete("DeletePurchaseOrder")]
        public IActionResult DeletePurchaseOrder(int id)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound($"PurchaseOrder with id {id} not found.");
            }

            context.purchaseOrders.Remove(purchaseOrder);
            context.SaveChanges();

            return Ok($"PurchaseOrder with id {id} deleted successfully.");
        }

        //Get all PurchaseOrders, including related Supplier and Items
        [HttpGet("GetPurchaseOrders")]
        public IActionResult GetPurchaseOrders()
        {
            List<PurchaseOrder> purchaseOrders = context.purchaseOrders
                .Include(p => p.supplier)
                .Include(p => p.purchaseOrderItems)
                .ToList();

            return Ok(purchaseOrders);
        }

        //Get a single PurchaseOrder by id
        [HttpGet("GetPurchaseOrder")]
        public IActionResult GetPurchaseOrder(int id)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders
                .Include(p => p.supplier)
                .Include(p => p.user)
                .Include(p => p.purchaseOrderItems)
                .FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound($"PurchaseOrder with id {id} not found.");
            }

            return Ok(purchaseOrder);
        }

        //Filter PurchaseOrders by status or date range
        [HttpGet("FilterPurchaseOrders")]
        public IActionResult FilterPurchaseOrders(string status, DateTime? from, DateTime? to)
        {
            var query = context.purchaseOrders.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(p => p.Status == status);
            }

            if (from.HasValue)
            {
                query = query.Where(p => p.OrderDate >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(p => p.OrderDate <= to.Value);
            }

            List<PurchaseOrder> purchaseOrders = query.ToList();
            return Ok(purchaseOrders);
        }

        //Sort/aggregate: total purchase value per Supplier
        [HttpGet("TotalPurchaseValuePerSupplier")]
        public IActionResult TotalPurchaseValuePerSupplier()
        {
            var result = context.purchaseOrders
                .Include(p => p.supplier)
                .GroupBy(p => new { p.SupplierId, p.supplier.Name })
                .Select(g => new
                {
                    SupplierId = g.Key.SupplierId,
                    SupplierName = g.Key.Name,
                    TotalPurchaseValue = g.Sum(p => p.TotalAmount)
                })
                .OrderByDescending(x => x.TotalPurchaseValue)
                .ToList();

            return Ok(result);
        }
    }
}
