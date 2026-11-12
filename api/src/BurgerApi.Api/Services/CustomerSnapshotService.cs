using BurgerApi.Domain;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public record CustomerSnapshot(int UserId, decimal TotalSpend);

public class CustomerSnapshotService(SpendLookup lookup)
{
    public async Task<CustomerSnapshot> GetAsync(int userId) => new(userId, await lookup.TotalAsync(userId));
}

public class SpendLookup(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public Task<decimal> TotalAsync(int userId)
    {
        if (userId <= 0) throw new DomainException("Unknown customer.", 404);
        return QueryTotalAsync(userId);
    }

    private async Task<decimal> QueryTotalAsync(int userId)
    {
        await using var c = new SqlConnection(_cs);
        return await c.ExecuteScalarAsync<decimal>(
            "SELECT ISNULL(SUM(Total), 0) FROM dbo.Orders WHERE UserId = @userId AND Status <> 'Cancelled'", new { userId });
    }
}
