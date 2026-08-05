using Inventory_And_Warehouse_Management.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    public class ProductController
    {
        private ProjectContext context;

        public ProductController(ProjectContext _context)
        {
            context = _context;
        }


        //Create a new Product
        public void AddProduct(Product p)
        {
            context.products.Add(p);
            context.SaveChanges();
        }


        //Delete a Product
        public void DeleteProduct(int id)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {

            }
            else
            {
                context.products.Remove(product);
                context.SaveChanges();
            }
        }

        //Get all Products, including their related Category
        public List<Product> GetProducts()
        {
            List<Product> products = context.products.Include(p => p.category).ToList();
            return products;
        }


       


    }
}
