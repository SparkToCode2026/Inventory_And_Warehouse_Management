using Inventory_And_Warehouse_Management.Models;
using Inventory_And_Warehouse_Management.Models.Dtos;
using Inventory_And_Warehouse_Management.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;

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
                Role = dto.Role,
                Phone = dto.Phone
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

        [Authorize] 
        [HttpPut("ChangePassword")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            // Read the caller's identity from the validated token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (userIdClaim == null || !int.TryParse(userIdClaim, out int userId))
                return Unauthorized("Could not identify the logged-in user.");

            var user = await _db.users.FirstOrDefaultAsync(u => u.UserId == userId);
            if (user == null)
                return NotFound("User not found.");

            var verifyResult = _hasher.VerifyHashedPassword(user, user.PasswordHash!, dto.CurrentPassword);
            if (verifyResult == PasswordVerificationResult.Failed)
                return BadRequest("Current password is incorrect.");

            if (string.IsNullOrEmpty(dto.NewPassword) || dto.NewPassword.Length < 6)
                return BadRequest("New password must be at least 6 characters.");

            user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
            await _db.SaveChangesAsync();

            return Ok("Password updated successfully.");
        }

    }
}
