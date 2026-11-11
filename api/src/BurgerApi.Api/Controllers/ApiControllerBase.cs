using System.Security.Claims;
using BurgerApi.Domain;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    protected bool IsStaff => User.IsInRole(Roles.Kitchen) || User.IsInRole(Roles.Manager);
}
