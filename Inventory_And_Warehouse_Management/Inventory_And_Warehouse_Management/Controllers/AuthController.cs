using Inventory_And_Warehouse_Management.Models;
using Inventory_And_Warehouse_Management.Models.Dtos;
using Inventory_And_Warehouse_Management.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory_And_Warehouse_Management.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ProjectContext _db;
        private readonly TokenService _tokenService;
        private readonly PasswordHasher<User> _hasher = new();

        public AuthController(ProjectContext db, TokenService tokenService)
        {
            _db = db;
            _tokenService = tokenService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (await _db.users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email already registered.");

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Role = dto.Role
            };
            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _db.users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new { token = _tokenService.CreateToken(user) });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var user = await _db.users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null) 
                return Unauthorized("Invalid credentials.");

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash!, dto.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized("Invalid credentials.");

            return Ok(new { token = _tokenService.CreateToken(user) });
        }
    }
}
