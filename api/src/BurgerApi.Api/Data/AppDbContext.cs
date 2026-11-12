using Microsoft.EntityFrameworkCore;

namespace BurgerApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<Promo> Promos => Set<Promo>();
    public DbSet<User> Users => Set<User>();
    public DbSet<BurgerApi.Services.TopCustomer> TopCustomers => Set<BurgerApi.Services.TopCustomer>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<MenuItem>().Property(x => x.Price).HasPrecision(10, 2);
        b.Entity<Ingredient>().Property(x => x.StockQty).HasPrecision(12, 2);
        b.Entity<Ingredient>().Property(x => x.ReorderLevel).HasPrecision(12, 2);
        b.Entity<Promo>().Property(x => x.Value).HasPrecision(10, 2);
        b.Entity<Promo>().Property(x => x.MinSubtotal).HasPrecision(10, 2);
        b.Entity<Promo>().Property(x => x.MaxDiscount).HasPrecision(10, 2);
        b.Entity<Promo>().ToTable(t => t.HasTrigger("trg_Promos_Audit"));
        b.Entity<User>().HasIndex(x => x.Email).IsUnique();
        b.Entity<BurgerApi.Services.TopCustomer>().Property(x => x.TotalSpend).HasPrecision(10, 2);
    }
}
