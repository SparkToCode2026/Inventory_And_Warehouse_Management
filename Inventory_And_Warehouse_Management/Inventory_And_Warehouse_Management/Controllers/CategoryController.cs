using Inventory_And_Warehouse_Management.Models;

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


    }
}
