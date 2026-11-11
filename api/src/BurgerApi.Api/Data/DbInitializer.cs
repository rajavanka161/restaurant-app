using System.Text.RegularExpressions;
using BurgerApi.Domain;
using BurgerApi.Services;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Data;

public static partial class DbInitializer
{
    public static async Task InitializeAsync(IServiceProvider sp, string connectionString, ILogger logger)
    {
        var builder = new SqlConnectionStringBuilder(connectionString);
        var dbName = builder.InitialCatalog;
        builder.InitialCatalog = "master";

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await using var master = new SqlConnection(builder.ConnectionString);
                await master.OpenAsync();
                await using var cmd = master.CreateCommand();
                cmd.CommandText = $"IF DB_ID(N'{dbName}') IS NULL CREATE DATABASE [{dbName}]";
                await cmd.ExecuteNonQueryAsync();
                break;
            }
            catch (SqlException) when (attempt < 30)
            {
                logger.LogInformation("Waiting for SQL Server (attempt {Attempt})...", attempt);
                await Task.Delay(2000);
            }
        }

        var dir = Path.Combine(AppContext.BaseDirectory, "db");
        await using (var conn = new SqlConnection(connectionString))
        {
            await conn.OpenAsync();
            foreach (var file in Directory.GetFiles(dir, "*.sql").Order())
            {
                var script = await File.ReadAllTextAsync(file);
                foreach (var batch in GoSeparator().Split(script).Where(b => !string.IsNullOrWhiteSpace(b)))
                {
                    await using var cmd = conn.CreateCommand();
                    cmd.CommandText = batch;
                    await cmd.ExecuteNonQueryAsync();
                }
            }
        }

        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        if (!await db.Users.AnyAsync())
        {
            db.Users.AddRange(
                new User { Email = "customer@burger.test", FullName = "Casey Customer", Role = Roles.Customer, PasswordHash = PasswordHasher.Hash("Password1!") },
                new User { Email = "kitchen@burger.test", FullName = "Kim Kitchen", Role = Roles.Kitchen, PasswordHash = PasswordHasher.Hash("Password1!") },
                new User { Email = "manager@burger.test", FullName = "Morgan Manager", Role = Roles.Manager, PasswordHash = PasswordHasher.Hash("Password1!") });
            await db.SaveChangesAsync();
        }
    }

    [GeneratedRegex(@"^\s*GO\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase)]
    private static partial Regex GoSeparator();
}
