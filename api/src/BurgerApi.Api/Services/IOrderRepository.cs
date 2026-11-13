using BurgerApi.Contracts;

namespace BurgerApi.Services;

public record OrderPayment(int UserId, string? PaymentReference, decimal Total, string PaymentStatus, string Status);

public interface IOrderRepository
{
    Task<Quote> QuoteAsync(IEnumerable<CartLine> items, string fulfillmentType, string? promoCode);
    Task<int> PlaceAsync(int userId, PlaceOrderRequest request, string paymentReference);
    Task<List<OrderSummary>> ListForUserAsync(int userId);
    Task<List<KitchenOrder>> ListActiveAsync();
    Task<List<OrderSummary>> ListRecentAsync(int count);
    Task<OrderDetail?> GetAsync(int orderId);
    Task<OrderPayment?> GetPaymentAsync(int orderId);
    Task UpdateStatusAsync(int orderId, string newStatus, int userId);
    Task CancelAsync(int orderId, int userId, bool isStaff);
    Task RefundAsync(int orderId, int userId);
    Task<DailySalesReport> DailyReportAsync(DateOnly date);
    Task<SalesTrendData> TrendAsync(DateOnly from, DateOnly to);
}
