using System.Data;
using BurgerApi.Contracts;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class SalesSnapshotService(IConfiguration config, ILogger<SalesSnapshotService> logger) : BackgroundService
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var seconds = config.GetValue("Background:SalesSnapshotSeconds", 3600);
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(seconds));
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await using var c = new SqlConnection(_cs);
                using var multi = await c.QueryMultipleAsync("dbo.usp_DailySalesReport",
                    new { Date = DateTime.UtcNow.Date }, commandType: CommandType.StoredProcedure);
                var summary = await multi.ReadSingleAsync<SalesSummary>();
                logger.LogInformation("Sales snapshot: {Orders} orders, {Net} net", summary.OrderCount, summary.NetSales);
            }
            catch (SqlException ex)
            {
                logger.LogWarning(ex, "Sales snapshot failed");
            }
        }
    }
}
