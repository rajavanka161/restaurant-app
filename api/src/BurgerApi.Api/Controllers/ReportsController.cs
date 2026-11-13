using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurgerApi.Controllers;

[Route("api/reports"), Authorize(Roles = Roles.Manager)]
public class ReportsController(IOrderRepository repo, ReportService reports) : ApiControllerBase
{
    [HttpGet("daily-sales")]
    public Task<DailySalesReport> Daily([FromQuery] DateOnly? date) =>
        repo.DailyReportAsync(date ?? DateOnly.FromDateTime(DateTime.UtcNow));

    [HttpGet("trends")]
    public Task<SalesTrendReport> Trends([FromQuery] DateOnly? from, [FromQuery] DateOnly? to)
    {
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        return reports.TrendAsync(from ?? end.AddDays(-6), end);
    }
}
