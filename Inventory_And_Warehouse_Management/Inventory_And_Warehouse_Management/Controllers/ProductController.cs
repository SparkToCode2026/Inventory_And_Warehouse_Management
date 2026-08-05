using Inventory_And_Warehouse_Management.Models;

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


    }
}
