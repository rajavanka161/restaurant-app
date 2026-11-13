using System.ComponentModel.DataAnnotations;

namespace BurgerApi.Contracts;

public record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
public record RegisterRequest([Required, EmailAddress] string Email, [Required, MinLength(6)] string Password, [Required] string FullName);
public record AuthResponse(string Token, string FullName, string Role);

public record CartLine([Range(1, int.MaxValue)] int MenuItemId, [Range(1, 50)] int Quantity);
public record QuoteRequest([Required, MinLength(1)] List<CartLine> Items, [Required] string FulfillmentType, string? PromoCode);
public record Quote(decimal Subtotal, decimal Discount, decimal Tax, decimal DeliveryFee, decimal Total, bool PromoValid);

public record PaymentInfo([Required] string CardNumber, [Required] string Name);
public record PlaceOrderRequest(
    [Required, MinLength(1)] List<CartLine> Items,
    [Required] string FulfillmentType,
    string? PromoCode, string? DeliveryAddress, string? Phone,
    [Required] PaymentInfo Payment);

public record OrderLine(string Name, decimal UnitPrice, int Quantity, decimal LineTotal);
public record StatusEntry(string Status, DateTime ChangedAt);
public record OrderSummary(int Id, int UserId, string CustomerName, string FulfillmentType, string Status, string PaymentStatus,
    decimal Subtotal, decimal Discount, decimal Tax, decimal DeliveryFee, decimal Total, string? PromoCode,
    string? DeliveryAddress, string? Phone, DateTime CreatedAt, DateTime UpdatedAt, int ItemCount);
public record KitchenOrder(OrderSummary Order, List<OrderLine> Items);
public record OrderDetail(OrderSummary Order, List<OrderLine> Items, List<StatusEntry> History);

public record MenuItemDto(int Id, int CategoryId, string Category, string Name, string Description, decimal Price, string Emoji, int? Calories, bool IsAvailable);
public record MenuCategoryDto(int Id, string Name, List<MenuItemDto> Items);
public record ReorderLine(MenuItemDto Item, int Quantity);
public record ReorderResult(List<ReorderLine> Available, List<string> Unavailable);
public record MenuItemUpsert([Required] string Name, string? Description, [Range(0, 1000)] decimal Price,
    int CategoryId, string? Emoji, int? Calories, bool IsAvailable);

public record IngredientUpsert([Required] string Name, string? Unit, [Range(0, 1000000)] decimal StockQty, [Range(0, 1000000)] decimal ReorderLevel);
public record StockAdjust([Range(0, 1000000)] decimal StockQty);

public record SalesSummary(DateTime SalesDate, int OrderCount, decimal GrossSales, decimal RefundedAmount, decimal NetSales, decimal DiscountsGiven, int CancelledCount);
public record TopItem(string Name, int Quantity, decimal Revenue);
public record HourlySales(int Hour, int Orders, decimal Sales);
public record DailySalesReport(SalesSummary Summary, List<TopItem> TopItems, List<HourlySales> Hourly);
