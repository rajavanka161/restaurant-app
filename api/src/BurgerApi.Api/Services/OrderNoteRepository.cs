using BurgerApi.Contracts;
using BurgerApi.Domain;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class OrderNoteRepository(IConfiguration config)
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    public async Task AddAsync(OrderNoteDto note, int authorUserId)
    {
        await using var c = new SqlConnection(_cs);
        try
        {
            await c.ExecuteAsync("INSERT dbo.OrderNotes (OrderId, AuthorUserId, Text) VALUES (@OrderId, @authorUserId, @Text)",
                new { note.OrderId, authorUserId, note.Text });
        }
        catch (SqlException ex) when (ex.Number == 547)
        {
            throw new DomainException("Order not found.", 404);
        }
    }

    public async Task<OrderNoteDto?> LatestAsync(int orderId)
    {
        await using var c = new SqlConnection(_cs);
        return await c.QuerySingleOrDefaultAsync<OrderNoteDto>(
            "SELECT TOP 1 OrderId, Text FROM dbo.OrderNotes WHERE OrderId = @orderId ORDER BY Id DESC", new { orderId });
    }
}
