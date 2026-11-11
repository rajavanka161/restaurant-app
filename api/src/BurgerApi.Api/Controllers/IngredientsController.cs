using BurgerApi.Contracts;
using BurgerApi.Data;
using BurgerApi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Controllers;

[Route("api/ingredients"), Authorize(Roles = Roles.Manager)]
public class IngredientsController(AppDbContext db) : ApiControllerBase
{
    [HttpGet]
    public async Task<List<Ingredient>> List() => await db.Ingredients.AsNoTracking().OrderBy(i => i.Name).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Ingredient>> Create(IngredientUpsert r)
    {
        var ing = new Ingredient { Name = r.Name.Trim(), Unit = r.Unit ?? "unit", StockQty = r.StockQty, ReorderLevel = r.ReorderLevel };
        db.Ingredients.Add(ing);
        await db.SaveChangesAsync();
        return ing;
    }

    [HttpPut("{id:int}/stock")]
    public async Task<ActionResult<Ingredient>> SetStock(int id, StockAdjust r)
    {
        var ing = await db.Ingredients.FindAsync(id);
        if (ing is null) return NotFound();
        ing.StockQty = r.StockQty;
        await db.SaveChangesAsync();
        return ing;
    }
}
