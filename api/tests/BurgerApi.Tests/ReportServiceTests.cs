using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;

namespace BurgerApi.Tests;

public class ReportServiceTests
{
    private readonly FakeRepo _repo = new();
    private ReportService Sut => new(_repo);

    private static PeriodTotals Totals(int orders, decimal net) => new(orders, net, 0, net, 0, 0);

    [Fact]
    public async Task Start_after_end_is_rejected()
    {
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.TrendAsync(new DateOnly(2026, 11, 10), new DateOnly(2026, 11, 1)));
        Assert.Equal(400, ex.StatusCode);
    }

    [Fact]
    public async Task Range_longer_than_the_limit_is_rejected()
    {
        var from = new DateOnly(2026, 1, 1);
        await Assert.ThrowsAsync<DomainException>(() => Sut.TrendAsync(from, from.AddDays(ReportService.MaxDays)));
        await Sut.TrendAsync(from, from.AddDays(ReportService.MaxDays - 1));
    }

    [Fact]
    public async Task Days_without_orders_are_filled_with_zero()
    {
        _repo.NextTrend = _repo.NextTrend with { Daily = [new DailyPoint(new DateTime(2026, 11, 2), 3, 45m)] };
        var report = await Sut.TrendAsync(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 3));
        Assert.Equal([0, 3, 0], report.Daily.Select(d => d.Orders));
        Assert.Equal([0m, 45m, 0m], report.Daily.Select(d => d.NetSales));
    }

    [Fact]
    public async Task Change_is_the_percentage_against_the_previous_period()
    {
        _repo.NextTrend = _repo.NextTrend with { Current = Totals(12, 150m), Previous = Totals(10, 120m) };
        var report = await Sut.TrendAsync(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 7));
        Assert.Equal(25m, report.NetSalesChangePct);
        Assert.Equal(20m, report.OrderCountChangePct);
    }

    [Fact]
    public async Task Change_is_unknown_when_the_previous_period_had_no_sales()
    {
        _repo.NextTrend = _repo.NextTrend with { Current = Totals(5, 60m), Previous = Totals(0, 0m) };
        var report = await Sut.TrendAsync(new DateOnly(2026, 11, 1), new DateOnly(2026, 11, 7));
        Assert.Null(report.NetSalesChangePct);
        Assert.Null(report.OrderCountChangePct);
    }
}
