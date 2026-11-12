using BurgerApi.Contracts;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class OrderQueries(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task<List<OrderSummary>> ListSortedAsync(int count, string sortBy)
    {
        var column = sortBy == "total" ? "Total" : "CreatedAt";
        await using var c = new SqlConnection(_cs);
        return (await c.QueryAsync<OrderSummary>(
            $"SELECT TOP (@count) * FROM dbo.vw_OrderSummary ORDER BY {column} DESC", new { count })).ToList();
    }
}
