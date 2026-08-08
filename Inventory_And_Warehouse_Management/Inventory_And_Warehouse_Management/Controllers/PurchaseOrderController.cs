using Inventory_And_Warehouse_Management.Models;
using Inventory_And_Warehouse_Management.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("PurchaseOrder")]
    public class PurchaseOrderController : ControllerBase
    {
        private ProjectContext context;
        private readonly IEmailService _emailService;

        public PurchaseOrderController(ProjectContext _context, IEmailService emailService)
        {
            context = _context;
            _emailService = emailService;
        }

        //Create a new PurchaseOrder (with validation)
        [HttpPost("AddPurchaseOrder")]
        public async Task<IActionResult> AddPurchaseOrder(PurchaseOrder po)
        {
            var allowedStatuses = new[] { "Pending", "Approved", "Received" };

            if (!allowedStatuses.Contains(po.Status))
                return BadRequest("Invalid status.");

            var supplier = context.suppliers.FirstOrDefault(s => s.SupplierId == po.SupplierId);
            if (supplier == null)
                return BadRequest("Invalid SupplierId.");

            context.purchaseOrders.Add(po);
            context.SaveChanges();

            await _emailService.SendEmailAsync(
                supplier.Email,
                $"Purchase Order #{po.PurchaseOrderId} Confirmation",
                $"We've placed Purchase Order #{po.PurchaseOrderId} with your company, totaling {po.TotalAmount:C}, dated {po.OrderDate:d}."
            );

            return Ok(po.PurchaseOrderId);
        }
        //A second distinct update case (change Status only)
        [HttpPatch("UpdatePurchaseOrderStatus")]
        public IActionResult UpdatePurchaseOrderStatus(int id, string status)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound("Purchase order not found");
            }
            else
            {
                purchaseOrder.Status = status;
                context.SaveChanges();
                return Ok("Purchase order Status Updated");
            }
        }

        //Delete a PurchaseOrder
        [HttpDelete("DeletePurchaseOrder")]
        public IActionResult DeletePurchaseOrder(int id)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {
                return NotFound("Purchase order not found");
            }
            else
            {
                context.purchaseOrders.Remove(purchaseOrder);
                context.SaveChanges();
                return Ok("Purchase order removed successfully");
            }
        }

        //Get all PurchaseOrders, including related Supplier and Items
        [HttpGet("GetPurchaseOrders")]
        public IActionResult GetPurchaseOrders()
        {
            var purchaseOrders = context.purchaseOrders
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
                return NotFound("purchase ordernot found");
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

            var purchaseOrders = query.ToList();
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
                .ToList<object>();

            return Ok(result);
        }
    }
}