using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api/catalog")]
public class CatalogController(MenuQueries queries) : ApiControllerBase
{
    public record CatalogItem(int Id, string Name, decimal Price, string Category);
    public record AvailableItem(int Id, string Name, decimal Price);

    [HttpGet("items"), Authorize(Roles = Roles.Manager)]
    public async Task<List<CatalogItem>> Items() =>
        (await queries.WithCategoryAsync()).Select(m => new CatalogItem(m.Id, m.Name, m.Price, m.Category!.Name)).ToList();

    [HttpGet("categories/{categoryId:int}/available")]
    public async Task<List<AvailableItem>> Available(int categoryId) =>
        (await queries.AvailableInCategoryAsync(categoryId)).Select(m => new AvailableItem(m.Id, m.Name, m.Price)).ToList();

    [HttpPost("categories/{categoryId:int}/availability"), Authorize(Roles = Roles.Manager)]
    public async Task<int> SetAvailability(int categoryId, [FromQuery] bool available) =>
        await queries.SetCategoryAvailabilityAsync(categoryId, available);
}
