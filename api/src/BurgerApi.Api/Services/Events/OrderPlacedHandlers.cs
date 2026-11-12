using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services.Events;

public class OrderPlacedLogger(ILogger<OrderPlacedLogger> logger) : IEventHandler<OrderPlaced>
{
    public Task HandleAsync(OrderPlaced e)
    {
        logger.LogInformation("Order {OrderId} placed by user {UserId} for {Total}", e.OrderId, e.UserId, e.Total);
        return Task.CompletedTask;
    }
}

public class OrderEventRecorder(IConfiguration config) : IEventHandler<OrderPlaced>
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task HandleAsync(OrderPlaced e)
    {
        await using var c = new SqlConnection(_cs);
        await c.ExecuteAsync("dbo.usp_RecordOrderEvent", new { e.OrderId, e.UserId, e.Total },
            commandType: CommandType.StoredProcedure);
    }
}
