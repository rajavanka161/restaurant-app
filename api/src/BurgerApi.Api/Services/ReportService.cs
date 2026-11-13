using BurgerApi.Contracts;
using BurgerApi.Domain;

namespace BurgerApi.Services;

public class ReportService(IOrderRepository repo)
{
    public const int MaxDays = 92;

    public async Task<SalesTrendReport> TrendAsync(DateOnly from, DateOnly to)
    {
        if (from > to) throw new DomainException("The start date must be on or before the end date.");
        if (to.DayNumber - from.DayNumber + 1 > MaxDays) throw new DomainException($"Pick a range of {MaxDays} days or fewer.");

        var data = await repo.TrendAsync(from, to);
        var byDay = data.Daily.ToDictionary(d => DateOnly.FromDateTime(d.SalesDate));
        var daily = Enumerable.Range(0, to.DayNumber - from.DayNumber + 1)
            .Select(i => from.AddDays(i))
            .Select(d => byDay.TryGetValue(d, out var p) ? p : new DailyPoint(d.ToDateTime(TimeOnly.MinValue), 0, 0m))
            .ToList();

        return new SalesTrendReport(from.ToDateTime(TimeOnly.MinValue), to.ToDateTime(TimeOnly.MinValue), data.Current, data.Previous,
            ChangePct(data.Current.NetSales, data.Previous.NetSales),
            ChangePct(data.Current.OrderCount, data.Previous.OrderCount),
            daily, data.PrepTimes);
    }

    private static decimal? ChangePct(decimal current, decimal previous) =>
        previous == 0 ? null : Math.Round((current - previous) / previous * 100m, 1);
}
