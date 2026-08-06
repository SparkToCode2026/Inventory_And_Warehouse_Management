using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static System.Net.WebRequestMethods;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("Category")]
    public class CategoryController : ControllerBase
    {
        private ProjectContext context;

        public CategoryController(ProjectContext _context)
        {
            context = _context;
        }



        //Create a new Category
        [HttpPost("AddCategory")]
        public void AddCategory(Category c)
        {
            context.categories.Add(c);
            context.SaveChanges();
        }

        //Update a Category (full update)
        [HttpPut("UpdateCategory")]
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

        //A second distinct update case (e.g.update just the description)
        [HttpPatch("UpdateCategoryDescription")]
        public void UpdateCategoryDescription(int id, string description)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if (category == null)
            {

            }
            else
            {
                category.Description = description;
                context.SaveChanges();
            }
        }


        //Delete a Category
        [HttpDelete("DeleteCategory")]
        public void DeleteCategory(int id)
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
        [HttpGet("GetCategories")]
        public List<Category> GetCategories()
        {
            List<Category> categories = context.categories.Include(c => c.products).ToList();
            return categories;
        }


        //Get a single Category by id
        [HttpGet("GetCategory")]
        public Category GetCategory(int id)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);
            return category;
        }

        //Filter Categories by name
        [HttpGet("FilterCategoriesByName")]
        public List<Category> FilterCategoriesByName(string name)
        {
            List<Category> categories = context.categories.Where(c => c.Name.Contains(name)).Include(c => c.products).ToList();
            return categories;
        }

        //SortCategory
        [HttpGet("SortCategoriesByNumOfProducts")]
        public List<Category> SortCategoriesByNumOfProducts()
        {
            List<Category> categories = context.categories.OrderBy(c => c.products.Count()).ToList();
            return categories;
        }
    }
}
