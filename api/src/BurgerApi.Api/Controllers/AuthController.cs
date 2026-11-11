using BurgerApi.Contracts;
using BurgerApi.Data;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Controllers;

[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens) : ApiControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest r)
    {
        var email = r.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null || !PasswordHasher.Verify(r.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });
        return new AuthResponse(tokens.Create(user), user.FullName, user.Role);
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest r)
    {
        var email = r.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(new { error = "An account with this email already exists." });
        var user = new User { Email = email, FullName = r.FullName.Trim(), Role = Roles.Customer, PasswordHash = PasswordHasher.Hash(r.Password) };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return new AuthResponse(tokens.Create(user), user.FullName, user.Role);
    }
}
