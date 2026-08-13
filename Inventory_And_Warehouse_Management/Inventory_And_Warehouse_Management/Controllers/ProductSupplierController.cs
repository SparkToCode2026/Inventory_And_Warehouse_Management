using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("ProductSupplier")]
    [Authorize]
    public class ProductSupplierController : ControllerBase
    {
        private ProjectContext context;
        public ProductSupplierController(ProjectContext _context)
        {
            context = _context;
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("AddProductSupplier")]
        public IActionResult AddProductSupplier(ProductSupplier ps)
        {
            if (context.productSuppliers.Any(x => x.productId == ps.productId && x.supplierId == ps.supplierId))
                return BadRequest("This ProductSupplier link already exists.");

            context.productSuppliers.Add(ps);
            context.SaveChanges();

            return Ok(new { ps.productId, ps.supplierId });
        }

        [Authorize]
        [HttpPut("UpdateProductSupplier")]
        public IActionResult UpdateProductSupplier(int pId, int sId, int newProductId, int newSupplierId)
        {
            ProductSupplier link = context.productSuppliers.FirstOrDefault(x => x.productId == pId && x.supplierId == sId);
            if (link == null)
                return NotFound("ProductSupplier link not found");

            bool alreadyExists = context.productSuppliers.Any(x => x.productId == newProductId && x.supplierId == newSupplierId);
            if (alreadyExists)
                return BadRequest("That ProductSupplier link already exists.");

            context.productSuppliers.Remove(link);
            context.productSuppliers.Add(new ProductSupplier { productId = newProductId, supplierId = newSupplierId });
            context.SaveChanges();

            return Ok("ProductSupplier link updated");
        }
        [Authorize]
        [HttpPatch("UpdateSupplierForProduct")]
        public IActionResult UpdateSupplierForProduct(int pId, int newSupplierId)
        {
            ProductSupplier link = context.productSuppliers.FirstOrDefault(x => x.productId == pId);
            if (link == null)
                return NotFound("ProductSupplier link not found");

            bool alreadyExists = context.productSuppliers.Any(x => x.productId == pId && x.supplierId == newSupplierId);
            if (alreadyExists)
                return BadRequest("This product is already linked to that supplier.");

            context.productSuppliers.Remove(link);
            context.productSuppliers.Add(new ProductSupplier { productId = pId, supplierId = newSupplierId });
            context.SaveChanges();

            return Ok("Supplier updated for this product");
        }

        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("RemoveProductSupplier")]
        public IActionResult RemoveProductSupplier(int pId, int sId)
        {
            ProductSupplier link = context.productSuppliers.FirstOrDefault(x => x.productId == pId && x.supplierId == sId);
            if (link == null)
            {
                return NotFound("ProductSupplier link not found");
            }
            else
            {
                context.productSuppliers.Remove(link);
                context.SaveChanges();
                return Ok("ProductSupplier link removed successfully");
            }
        }


        [HttpGet("GetAllProductSuppliers")]
        public IActionResult GetAllProductSuppliers()
        {
            var links = context.productSuppliers.Include(x => x.product).Include(x => x.supplier)
                .Select(x => new { x.productId, x.product, x.supplierId, x.supplier }).ToList();
            return Ok(links);
        }

        [HttpGet("GetProductSupplier")]
        public IActionResult GetProductSupplier(int pId, int sId)
        {
            ProductSupplier link = context.productSuppliers.Include(x => x.product).Include(x => x.supplier)
                .FirstOrDefault(x => x.productId == pId && x.supplierId == sId);
            if (link == null)
                return NotFound("ProductSupplier link not found");

            return Ok(link);
        }

        [HttpGet("FilterProductSuppliersBySupplier")]
        public IActionResult FilterProductSuppliersBySupplier(int sId)
        {
            var links = context.productSuppliers.Include(x => x.product).Include(x => x.supplier)
                .Where(x => x.supplierId == sId)
                .Select(x => new { x.productId, x.product, x.supplierId, x.supplier }).ToList();

            return Ok(links);
        }

        [HttpGet("CountSuppliersPerProduct")]
        public IActionResult CountSuppliersPerProduct()
        {
            var result = context.productSuppliers
                .GroupBy(x => x.productId)
                .Select(g => new { ProductId = g.Key, SupplierCount = g.Count() })
                .ToList();

            return Ok(result);
        }
    }
}
