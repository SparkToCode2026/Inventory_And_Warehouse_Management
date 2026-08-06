using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static System.Net.WebRequestMethods;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Product")]
    public class ProductController : ControllerBase
    {
        private ProjectContext context;

        public ProductController(ProjectContext _context)
        {
            context = _context;
        }


        //Create a new Product
        [HttpPost("AddProduct")]
        public IActionResult AddProduct(Product p)
        {
            context.products.Add(p);
            context.SaveChanges();
            return Ok();
        }

        //Update a Product  (full update)
        [HttpPut("UpdateProduct")]
        public IActionResult UpdateProduct(int id, string name, decimal price, string description)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found");
            }
            else
            {
                product.Name = name;
                product.Description = description;
                product.Price = price;
                context.SaveChanges();
                return Ok("Update successfully");
            }
        }

        //A second distinct update case (e.g.update just the price)
        [HttpPatch("UpdateProductPrice")]
        public IActionResult UpdateProductPrice(int id, decimal price)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found");
            }
            else
            {
                product.Price = price;
                context.SaveChanges();
                return Ok("Update successfully");
            }
        }

        //Delete a Product
        [HttpDelete("DeleteProduct")]
        public IActionResult DeleteProduct(int id)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound("Product not found");
            }
            else
            {
                context.products.Remove(product);
                context.SaveChanges();
                return Ok("Delete successfully");
            }
        }

        //Get all Products, including their related Category
        [HttpGet("GetProducts")]
        public IActionResult GetProducts()
        {
            List<Product> products = context.products.Include(p => p.category).ToList();
            if (products.Count == 0)
            {
                return NotFound("There are no products");
            }
            return Ok(products);
        }


        //Get a single Product by id
        [HttpGet("GetProduct")]
        public IActionResult GetProduct(int id)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);
            if (product == null)
            {
                return NotFound("Product not found");
            }
            return Ok(product);
        }

        //Filter Products by max price 
        [HttpGet("ProductsMaxPrice")]
        public IActionResult ProductsMaxPrice(decimal maxPrice)
        {
            List<Product> products = context.products.Where(p => p.Price <= maxPrice).ToList();
            if (products.Count == 0)
            {
                return NotFound("There are no products");
            }
            return Ok(products);
        }

        //sort by price
        [HttpGet("SortProductsByPrice")]
        public IActionResult SortProductsByPrice()
        {
            List<Product> products = context.products.OrderBy(p => p.Price).ToList();
            if (products.Count == 0)
            {
                return NotFound("There are no products");
            }
            return Ok(products);
        }

    }
}
