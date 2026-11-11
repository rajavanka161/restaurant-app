namespace BurgerApi.Data;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public int SortOrder { get; set; }
}

public class MenuItem
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Emoji { get; set; } = "🍔";
    public int? Calories { get; set; }
    public bool IsAvailable { get; set; } = true;
}

public class Ingredient
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Unit { get; set; } = "unit";
    public decimal StockQty { get; set; }
    public decimal ReorderLevel { get; set; }
}

public class Promo
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string DiscountType { get; set; } = "Percent";
    public decimal Value { get; set; }
    public decimal MinSubtotal { get; set; }
    public decimal? MaxDiscount { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string FullName { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "Customer";
}
