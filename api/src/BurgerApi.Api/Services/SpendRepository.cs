using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public record CustomerSpend(int OrderCount, decimal TotalSpend, decimal TaxOnSpend);

public class SpendRepository(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task<CustomerSpend> CustomerSpendAsync(int userId)
    {
        await using var c = new SqlConnection(_cs);
        return await c.QuerySingleAsync<CustomerSpend>("dbo.usp_CustomerSpend", new { UserId = userId },
            commandType: CommandType.StoredProcedure);
    }
}
