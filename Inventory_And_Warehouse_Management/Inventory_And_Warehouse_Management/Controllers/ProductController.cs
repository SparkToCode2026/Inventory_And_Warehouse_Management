using Inventory_And_Warehouse_Management.Models;
using Microsoft.EntityFrameworkCore;
using static System.Net.WebRequestMethods;

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

        //Update a Product  (full update)
        public void UpdateProduct(int id, string name, decimal price, string description)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {

            }
            else
            {
                product.Name = name;
                product.Description = description;
                product.Price = price;
                context.SaveChanges();
            }
        }

        //A second distinct update case (e.g.update just the price)
        public void UpdateProductPrice(int id, decimal price)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);

            if (product == null)
            {

            }
            else
            {
                product.Price = price;
                context.SaveChanges();
            }
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


        //Get a single Product by id
        public Product GetProduct(int id)
        {
            Product product = context.products.FirstOrDefault(p => p.ProductId == id);
            return product;
        }

        //Filter Products by max price 
        public List<Product> ProductsMaxPrice(decimal maxPrice)
        {
            List<Product> products = context.products.Where(p => p.Price <= maxPrice).ToList();
            return products;
        }

        //sort by price
        public List<Product> SortProductsByPrice()
        {
            List<Product> products = context.products.OrderBy(p => p.Price).ToList();
            return products;
        }

    }
}
