using BurgerApi.Contracts;
using BurgerApi.Data;
using BurgerApi.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Controllers;

[Route("api/menu")]
public class MenuController(AppDbContext db) : ApiControllerBase
{
    [HttpGet]
    public async Task<List<MenuCategoryDto>> Get()
    {
        var cats = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        var items = await db.MenuItems.AsNoTracking().Where(i => i.IsAvailable).OrderBy(i => i.Id).ToListAsync();
        return cats.Select(c => new MenuCategoryDto(c.Id, c.Name,
            items.Where(i => i.CategoryId == c.Id).Select(i => ToDto(i, c.Name)).ToList()))
            .Where(c => c.Items.Count > 0).ToList();
    }

    [HttpGet("all"), Authorize(Roles = Roles.Manager)]
    public async Task<List<MenuItemDto>> All() =>
        await (from i in db.MenuItems.AsNoTracking()
               join c in db.Categories on i.CategoryId equals c.Id
               orderby c.SortOrder, i.Id
               select new MenuItemDto(i.Id, i.CategoryId, c.Name, i.Name, i.Description, i.Price, i.Emoji, i.Calories, i.IsAvailable)).ToListAsync();

    [HttpGet("categories")]
    public async Task<List<Category>> Categories() => await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();

    [HttpPost, Authorize(Roles = Roles.Manager)]
    public async Task<ActionResult<MenuItemDto>> Create(MenuItemUpsert r)
    {
        var cat = await db.Categories.FindAsync(r.CategoryId);
        if (cat is null) return BadRequest(new { error = "Unknown category." });
        var item = new MenuItem();
        Apply(item, r);
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        return ToDto(item, cat.Name);
    }

    [HttpPut("{id:int}"), Authorize(Roles = Roles.Manager)]
    public async Task<ActionResult<MenuItemDto>> Update(int id, MenuItemUpsert r)
    {
        var item = await db.MenuItems.FindAsync(id);
        if (item is null) return NotFound();
        var cat = await db.Categories.FindAsync(r.CategoryId);
        if (cat is null) return BadRequest(new { error = "Unknown category." });
        Apply(item, r);
        await db.SaveChangesAsync();
        return ToDto(item, cat.Name);
    }

    private static void Apply(MenuItem i, MenuItemUpsert r)
    {
        i.Name = r.Name.Trim();
        i.Description = r.Description?.Trim() ?? "";
        i.Price = r.Price;
        i.CategoryId = r.CategoryId;
        i.Emoji = string.IsNullOrWhiteSpace(r.Emoji) ? "🍔" : r.Emoji;
        i.Calories = r.Calories;
        i.IsAvailable = r.IsAvailable;
    }

    private static MenuItemDto ToDto(MenuItem i, string cat) =>
        new(i.Id, i.CategoryId, cat, i.Name, i.Description, i.Price, i.Emoji, i.Calories, i.IsAvailable);
}
