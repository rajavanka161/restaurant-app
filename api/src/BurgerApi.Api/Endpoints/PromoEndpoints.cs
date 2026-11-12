using BurgerApi.Data;
using BurgerApi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Endpoints;

public static class PromoEndpoints
{
    public static IEndpointRouteBuilder MapPromoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/promos").RequireAuthorization(new AuthorizeAttribute { Roles = Roles.Manager });

        group.MapGet("/active-count", async (AppDbContext db) => await db.Promos.CountAsync(p => p.IsActive));

        group.MapPost("/{code}/deactivate", async (string code, AppDbContext db) =>
        {
            var promo = await db.Promos.FirstOrDefaultAsync(p => p.Code == code.ToUpper());
            if (promo is null) return Results.NotFound();
            promo.IsActive = false;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return app;
    }
}
