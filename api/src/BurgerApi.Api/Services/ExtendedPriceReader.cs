using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class ExtendedPriceReader(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task<List<decimal>> ForOrderAsync(int orderId)
    {
        await using var c = new SqlConnection(_cs);
        return (await c.QueryAsync<decimal>(
            "SELECT ExtendedPrice FROM dbo.OrderItems WHERE OrderId = @orderId ORDER BY Id", new { orderId })).ToList();
    }
}
