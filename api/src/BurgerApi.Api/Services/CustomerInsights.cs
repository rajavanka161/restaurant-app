using BurgerApi.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Services;

[Keyless]
public class TopCustomer
{
    public int UserId { get; set; }
    public string FullName { get; set; } = "";
    public int OrderCount { get; set; }
    public decimal TotalSpend { get; set; }
}

public class CustomerInsights(AppDbContext db)
{
    public Task<List<TopCustomer>> TopCustomersAsync(int count) =>
        db.TopCustomers.FromSqlRaw("EXEC dbo.usp_TopCustomers @Count", new SqlParameter("Count", count)).ToListAsync();
}
