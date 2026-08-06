using BCrypt.Net;
using Inventory_And_Warehouse_Management.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("User")]
    public class UserController : Controller
    {
        private ProjectContext context;
        public UserController(ProjectContext _context)
        {
            context = _context;
        }

        [HttpPost("AddUser")]
        public IActionResult AddUser(User u)
        {
            //checks that Name, Email, and Password aren't blank before doing anything else.
            if (string.IsNullOrEmpty(u.Name) || string.IsNullOrEmpty(u.Email) || string.IsNullOrEmpty(u.PasswordHash)) 
                return BadRequest("Name, Email and Password are required.");
            //checks no two users have the same email
            if (context.users.Any(x => x.Email == u.Email))
                return BadRequest("Email already exists.");
            //hashing password
            u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.PasswordHash);

            context.users.Add(u);
            context.SaveChanges();

            return Ok(u.UserId);
        }

        [HttpPut("UpdateUser")]
        public IActionResult UpdateUser(int id,User newUser) 
        {
            User user = context.users.FirstOrDefault(u => u.UserId == id);
            user.Name = newUser.Name;
            user.Email = newUser.Email;
            user.Role = newUser.Role;
            user.Phone = newUser.Phone;

            context.SaveChanges();
            return Ok("User Updated");
        }

        [HttpPatch("UpdateUserRole")]
        public IActionResult UpdateUserRole(int id , string newRole)
        {
            User user = context.users.FirstOrDefault(u => u.UserId == id);
            user.Role = newRole;
            context.SaveChanges();
            return Ok("User Role Updated");
        }

        [HttpDelete("RemoveUser")]
        public IActionResult RemoveUser(int id)
        {
            User user = context.users.FirstOrDefault(u => u.UserId == id);
            if (user == null)
            {
                return NotFound("user not found");
            }
            else
            {
                context.users.Remove(user);
                context.SaveChanges();
                return Ok("User removed successfully");
            }
        }

        [HttpGet("GetAllUsers")]
        public IActionResult GetAllUsers()
        {
            var users = context.users.Include(u => u._warehouse)
                .Select(u => new{u.UserId,u.Name,u.Email,u.Role,u.Phone,u.WarehouseId,u._warehouse}).ToList();
            return Ok(users);
        }

        [HttpGet("GetUser")]
        public IActionResult GetUser(int id)
        {
            User user = context.users.FirstOrDefault(u => u.UserId == id);
            return Ok(user);
        }

        [HttpGet("GetUsersByRole")]
        public IActionResult GetUsersByRole(string role)
        {
            var users = context.users.Include(u => u._warehouse)
                .Where(u => u.Role == role)
                .Select(u => new { u.UserId, u.Name, u.Email, u.Role, u.Phone, u.WarehouseId, u._warehouse }).ToList();
            return Ok(users);
        }

        [HttpGet("CountUsersPerWarehouse")]
        public IActionResult CountUsersPerWarehouse()
        {
            var result = context.users
                .Include(u => u._warehouse)
                .GroupBy(u => u._warehouse.WarehouseId)
                .Select(g => new{WarehouseName = g.Key,UserCount = g.Count()})
                .ToList();

            return Ok(result);
        }
    }
}
