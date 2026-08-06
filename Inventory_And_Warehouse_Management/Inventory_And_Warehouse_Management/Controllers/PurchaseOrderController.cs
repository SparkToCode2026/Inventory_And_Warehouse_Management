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
        public void AddPurchaseOrder(PurchaseOrder po)
        {
            var allowedStatuses = new[] { "Pending", "Approved", "Received" };

            if (!allowedStatuses.Contains(po.Status))
            {

            }
            else
            {
                context.purchaseOrders.Add(po);
                context.SaveChanges();
            }
        }

        //Update a PurchaseOrder (full update)
        [HttpPut("UpdatePurchaseOrder")]
        public void UpdatePurchaseOrder(int id, string status, decimal totalAmount, DateTime orderDate, int supplierId, int userId)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {

            }
            else
            {
                purchaseOrder.Status = status;
                purchaseOrder.TotalAmount = totalAmount;
                purchaseOrder.OrderDate = orderDate;
                purchaseOrder.SupplierId = supplierId;
                purchaseOrder.UserId = userId;
                context.SaveChanges();
            }
        }

        //A second distinct update case (change Status only)
        [HttpPatch("UpdatePurchaseOrderStatus")]
        public void UpdatePurchaseOrderStatus(int id, string status)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {

            }
            else
            {
                purchaseOrder.Status = status;
                context.SaveChanges();
            }
        }

        //Delete a PurchaseOrder
        [HttpDelete("DeletePurchaseOrder")]
        public void DeletePurchaseOrder(int id)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders.FirstOrDefault(p => p.PurchaseOrderId == id);

            if (purchaseOrder == null)
            {

            }
            else
            {
                context.purchaseOrders.Remove(purchaseOrder);
                context.SaveChanges();
            }
        }

        //Get all PurchaseOrders, including related Supplier and Items
        [HttpGet("GetPurchaseOrders")]
        public List<PurchaseOrder> GetPurchaseOrders()
        {
            List<PurchaseOrder> purchaseOrders = context.purchaseOrders
                .Include(p => p.supplier)
                .Include(p => p.purchaseOrderItems)
                .ToList();

            return purchaseOrders;
        }

        //Get a single PurchaseOrder by id
        [HttpGet("GetPurchaseOrder")]
        public PurchaseOrder GetPurchaseOrder(int id)
        {
            PurchaseOrder purchaseOrder = context.purchaseOrders
                .Include(p => p.supplier)
                .Include(p => p.user)
                .Include(p => p.purchaseOrderItems)
                .FirstOrDefault(p => p.PurchaseOrderId == id);

            return purchaseOrder;
        }

        //Filter PurchaseOrders by status or date range
        [HttpGet("FilterPurchaseOrders")]
        public List<PurchaseOrder> FilterPurchaseOrders(string status, DateTime? from, DateTime? to)
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
            return purchaseOrders;
        }

        //Sort/aggregate: total purchase value per Supplier
        [HttpGet("TotalPurchaseValuePerSupplier")]
        public List<object> TotalPurchaseValuePerSupplier()
        {
            List<object> result = context.purchaseOrders
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

            return result;
        }
    }
}
