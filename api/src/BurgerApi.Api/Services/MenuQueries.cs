using BurgerApi.Data;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Services;

public class MenuQueries(AppDbContext db)
{
    public Task<List<MenuItem>> WithCategoryAsync() =>
        db.MenuItems.AsNoTracking().Include(m => m.Category).OrderBy(m => m.Id).ToListAsync();

    public Task<List<MenuItem>> AvailableInCategoryAsync(int categoryId) =>
        db.MenuItems.FromSqlRaw("EXEC dbo.usp_AvailableMenuItems @CategoryId", new SqlParameter("CategoryId", categoryId))
            .AsNoTracking().ToListAsync();

    public Task<int> SetCategoryAvailabilityAsync(int categoryId, bool available) =>
        db.Database.ExecuteSqlRawAsync("UPDATE dbo.MenuItems SET IsAvailable = @available WHERE CategoryId = @categoryId",
            new SqlParameter("available", available), new SqlParameter("categoryId", categoryId));
}
