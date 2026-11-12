using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api/orders/{id:int}/receipt")]
public class ReceiptsController(IOrderRepository repo, IReceiptRenderer renderer) : ApiControllerBase
{
    [HttpGet, Authorize]
    public async Task<IActionResult> Get(int id)
    {
        var order = await repo.GetAsync(id);
        if (order is null || (!IsStaff && order.Order.UserId != UserId)) return NotFound();
        return Content(renderer.Render(order), renderer.ContentType);
    }
}
