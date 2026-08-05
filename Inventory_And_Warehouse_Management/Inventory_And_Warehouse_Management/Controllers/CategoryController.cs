using Inventory_And_Warehouse_Management.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    public class CategoryController
    {
        private ProjectContext context;

        public CategoryController(ProjectContext _context)
        {
            context = _context;
        }



        //Create a new Category
        public void AddCategory(Category c)
        {
            context.categories.Add(c);
            context.SaveChanges();
        }

        //Update a Category (full update)
        public void UpdateCategory(int id, string name, string description)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if(category == null)
            {

            }
            else
            {
                category.Name = name;
                category.Description = description;
                context.SaveChanges();
            }
        }


        //Delete a Category
        public void DeleteProduct(int id)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if (category == null)
            {

            }
            else
            {
                context.categories.Remove(category);
                context.SaveChanges();
            }
        }


        //Get all Categories, including their related Products
        public List<Category> GetCategories()
        {
            List<Category> categories = context.categories.Include(c => c.products).ToList();
            return categories;
        }


        //Get a single Category by id
        public Category GetCategory(int id)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);
            return category;
        }
    }
}
