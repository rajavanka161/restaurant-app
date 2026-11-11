using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api/reports"), Authorize(Roles = Roles.Manager)]
public class ReportsController(IOrderRepository repo) : ApiControllerBase
{
    [HttpGet("daily-sales")]
    public Task<DailySalesReport> Daily([FromQuery] DateOnly? date) =>
        repo.DailyReportAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow));
}
