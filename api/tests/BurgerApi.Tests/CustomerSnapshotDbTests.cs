using BurgerApi.Services;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;

namespace BurgerApi.Tests;

public static class DbTestSupport
{
    public static readonly string ConnectionString = Environment.GetEnvironmentVariable("BURGER_TEST_CS")
        ?? "Server=localhost,1433;Database=BurgerDb;User Id=sa;Password=Burger_Dev_Pass1!;TrustServerCertificate=True";

    public static readonly bool Available = Probe();

    public static IConfiguration Config() => new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Default"] = ConnectionString })
        .Build();

    private static bool Probe()
    {
        try
        {
            using var c = new SqlConnection(new SqlConnectionStringBuilder(ConnectionString) { ConnectTimeout = 3 }.ConnectionString);
            c.Open();
            using var cmd = new SqlCommand("SELECT OBJECT_ID(N'dbo.Orders')", c);
            return cmd.ExecuteScalar() is int;
        }
        catch (SqlException)
        {
            return false;
        }
    }
}

public sealed class DbFactAttribute : FactAttribute
{
    public DbFactAttribute()
    {
        if (!DbTestSupport.Available) Skip = "SQL Server with the BurgerDb schema is not reachable. Start docker compose and run the API once, or set BURGER_TEST_CS.";
    }
}

public class CustomerSnapshotDbTests
{
    [DbFact]
    public async Task Snapshot_of_a_customer_with_no_orders_reads_zero_from_the_orders_table()
    {
        var service = new CustomerSnapshotService(new SpendLookup(DbTestSupport.Config()));

        var snapshot = await service.GetAsync(int.MaxValue);

        Assert.Equal(int.MaxValue, snapshot.UserId);
        Assert.Equal(0m, snapshot.TotalSpend);
    }
}
