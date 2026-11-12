using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api/order-notes"), Authorize(Roles = Roles.Staff)]
public class OrderNotesController(OrderNoteRepository notes) : ApiControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Add(OrderNoteDto note)
    {
        await notes.AddAsync(note, UserId);
        return NoContent();
    }

    [HttpGet("{orderId:int}/latest")]
    public async Task<ActionResult<OrderNoteDto>> Latest(int orderId)
    {
        var note = await notes.LatestAsync(orderId);
        return note is null ? NotFound() : note;
    }
}
