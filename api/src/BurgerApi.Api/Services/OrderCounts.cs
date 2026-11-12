using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class OrderCounts(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task<(int Unqualified, int Qualified)> CountAsync()
    {
        await using var c = new SqlConnection(_cs);
        var unqualified = await c.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Orders");
        var qualified = await c.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM dbo.Orders");
        return (unqualified, qualified);
    }
}
