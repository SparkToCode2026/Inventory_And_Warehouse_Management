using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("StockMovement")]
    public class StockMovementController : Controller
    {
        private ProjectContext context;
        public StockMovementController(ProjectContext _context)
        {
            context = _context;
        }

        [HttpPost("AddStockMovement")]
        public IActionResult AddStockMovement(StockMovement m)
        {
            if (m.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (string.IsNullOrEmpty(m.MovementType))
                return BadRequest("MovementType is required.");

            if (!context.products.Any(x => x.ProductId == m.ProductId))
                return BadRequest("Invalid ProductId.");

            if (!context.warehouses.Any(x => x.WarehouseId == m.WarehouseId))
                return BadRequest("Invalid WarehouseId.");

            context.stockMovements.Add(m);
            context.SaveChanges();

            return Ok(m.StockMovementId);
        }

        [HttpPut("UpdateStockMovement")]
        public IActionResult UpdateStockMovement (int id , StockMovement m)
        {
            StockMovement sm = context.stockMovements.FirstOrDefault(s => s.StockMovementId == id);
            if (sm == null)
                return NotFound("Stock Movement not found");

            sm.Quantity = m.Quantity;
            sm.MovementDate = m.MovementDate;
            sm.MovementType = m.MovementType;
            sm.ProductId = m.ProductId;
            sm.WarehouseId = m.WarehouseId;
            context.SaveChanges();

            return Ok("Stock Movement Updated");
        }

        [HttpPatch("UpdateStockMovementQuantity")]
        public IActionResult UpdateStockMovementQuantity(int id , int newQuantity)
        {
            StockMovement sm = context.stockMovements.FirstOrDefault(s => s.StockMovementId == id);
            if (sm == null)
                return NotFound("Stock Movement not found");

            sm.Quantity = newQuantity;
            context.SaveChanges();
            return Ok("Stock Movement Quantity Updated");
        }

        [HttpDelete("RemoveStockMovement")]
        public IActionResult RemoveStockMovement(int id)
        {
            StockMovement sm = context.stockMovements.FirstOrDefault(s => s.StockMovementId == id);
            if (sm == null)
            {
                return NotFound("StockMovement not found");
            }
            else
            {
                context.stockMovements.Remove(sm);
                context.SaveChanges();
                return Ok("StockMovement removed successfully");
            }
        }

        [HttpGet("GetAllStockMovements")]
        public IActionResult GetAllStockMovements()
        {
            var movements = context.stockMovements.Include(m => m.product).Include(m => m._warehouse)
                .Select(m => new { m.StockMovementId, m.Quantity, m.MovementDate, m.MovementType, m.ProductId, m.product, m.WarehouseId, m._warehouse }).ToList();
            return Ok(movements);
        }

        [HttpGet("GetStockMovement")]
        public IActionResult GetStockMovement(int id)
        {
            StockMovement sm = context.stockMovements.FirstOrDefault(s => s.StockMovementId == id);
            if (sm == null)
                return NotFound("Stock Movement not found");
            return Ok (sm);
        }

        [HttpGet("GetStockMovementsByDate")]
        public IActionResult GetStockMovementsByDate(DateTime startDate, DateTime endDate)
        {
            var movements = context.stockMovements.Include(m => m.product).Include(m => m._warehouse)
        .Where(m => m.MovementDate >= startDate && m.MovementDate <= endDate)
        .Select(m => new { m.StockMovementId, m.Quantity, m.MovementDate, m.MovementType, m.ProductId, m.product, m.WarehouseId, m._warehouse }).ToList();
            return Ok(movements);
        }

        [HttpGet("SumQuantityByMovementType")]
        public IActionResult SumQuantityByMovementType()
        {
            var result = context.stockMovements
                .GroupBy(m => m.MovementType)
                .Select(g => new { MovementType = g.Key, TotalQuantity = g.Sum(x => x.Quantity) })
                .ToList();

            return Ok(result);
        }
    }
}
