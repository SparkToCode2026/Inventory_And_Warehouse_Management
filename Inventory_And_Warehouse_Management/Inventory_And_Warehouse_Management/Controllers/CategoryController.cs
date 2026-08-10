using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Authorization;
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
        [Authorize(Roles = "Manager,Admin")]
        [HttpPost("AddCategory")]
        public IActionResult AddCategory(Category c)
        {
            context.categories.Add(c);
            context.SaveChanges();
            return Ok(); 
        }

        //Update a Category (full update)
        [Authorize]
        [HttpPut("UpdateCategory")]
        public IActionResult UpdateCategory(int id, string name, string description)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if(category == null)
            {
                return NotFound("Category not found");
            }
            else
            {
                category.Name = name;
                category.Description = description;
                context.SaveChanges();
                return Ok("Update successfully");
            }
        }

        //A second distinct update case (e.g.update just the description)
        [Authorize]
        [HttpPatch("UpdateCategoryDescription")]
        public IActionResult UpdateCategoryDescription(int id, string description)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound("Category not found");
            }
            else
            {
                category.Description = description;
                context.SaveChanges();
                return Ok("Update successfully");
            }
        }


        //Delete a Category
        [Authorize(Roles = "Manager,Admin")]
        [HttpDelete("DeleteCategory")]
        public IActionResult DeleteCategory(int id)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);

            if (category == null)
            {
                return NotFound("Category not found");
            }
            else
            {
                context.categories.Remove(category);
                context.SaveChanges();
                return Ok("Delete successfully");
            }
        }


        //Get all Categories, including their related Products
        [HttpGet("GetCategories")]
        public IActionResult GetCategories()
        {
            List<Category> categories = context.categories.Include(c => c.products).ToList();
            if (categories.Count == 0)
            {
                return NotFound("There are no categorys");
            }
            return Ok(categories);
        }


        //Get a single Category by id
        [HttpGet("GetCategory")]
        public IActionResult GetCategory(int id)
        {
            Category category = context.categories.FirstOrDefault(c => c.CategoryId == id);
            if (category == null)
            {
                return NotFound("Category not found");
            }
            return Ok(category);
        }

        //Filter Categories by name
        [HttpGet("FilterCategoriesByName")]
        public IActionResult FilterCategoriesByName(string name)
        {
            List<Category> categories = context.categories.Where(c => c.Name.Contains(name)).Include(c => c.products).ToList();
            if (categories.Count == 0)
            {
                return NotFound("Categorys not found");
            }
            return Ok(categories);
        }

        //SortCategory
        [HttpGet("SortCategoriesByNumOfProducts")]
        public IActionResult SortCategoriesByNumOfProducts()
        {
            List<Category> categories = context.categories.OrderBy(c => c.products.Count()).ToList();
            if (categories.Count == 0)
            {
                return NotFound("There are no categorys");
            }
            return Ok(categories);
        }
    }
}
