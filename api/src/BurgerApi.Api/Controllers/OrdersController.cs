using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api")]
public class OrdersController(OrderService orders, IOrderRepository repo) : ApiControllerBase
{
    [HttpPost("cart/quote")]
    public Task<Quote> Quote(QuoteRequest r) => orders.QuoteAsync(r);

    [HttpPost("orders"), Authorize]
    public async Task<ActionResult<OrderDetail>> Place(PlaceOrderRequest r)
    {
        var id = await orders.PlaceOrderAsync(UserId, r);
        return CreatedAtAction(nameof(Get), new { id }, await repo.GetAsync(id));
    }

    [HttpGet("orders"), Authorize(Roles = Roles.Manager)]
    public Task<List<OrderSummary>> Recent() => repo.ListRecentAsync(50);

    [HttpGet("orders/mine"), Authorize]
    public Task<List<OrderSummary>> Mine() => repo.ListForUserAsync(UserId);

    [HttpGet("orders/{id:int}"), Authorize]
    public async Task<ActionResult<OrderDetail>> Get(int id)
    {
        var order = await repo.GetAsync(id);
        if (order is null || (!IsStaff && order.Order.UserId != UserId)) return NotFound();
        return order;
    }

    [HttpPost("orders/{id:int}/cancel"), Authorize]
    public async Task<IActionResult> Cancel(int id)
    {
        await orders.CancelAsync(id, UserId, IsStaff);
        return NoContent();
    }

    [HttpPost("orders/{id:int}/refund"), Authorize(Roles = Roles.Manager)]
    public async Task<IActionResult> Refund(int id)
    {
        await orders.RefundAsync(id, UserId);
        return NoContent();
    }

    [HttpGet("kitchen/orders"), Authorize(Roles = Roles.Staff)]
    public Task<List<KitchenOrder>> Active() => repo.ListActiveAsync();

    [HttpGet("kitchen/open-count"), Authorize(Roles = Roles.Staff)]
    public async Task<int> OpenCount() => (await repo.ListActiveAsync()).Count;

    [HttpPost("kitchen/orders/{id:int}/status"), Authorize(Roles = Roles.Staff)]
    public async Task<IActionResult> SetStatus(int id, [FromBody] StatusChange r)
    {
        await orders.UpdateStatusAsync(id, r.Status, UserId);
        return NoContent();
    }

    public record StatusChange(string Status);
}
