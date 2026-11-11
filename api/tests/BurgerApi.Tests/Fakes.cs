using BurgerApi.Contracts;
using BurgerApi.Services;

namespace BurgerApi.Tests;

public class FakeGateway : IPaymentGateway
{
    public List<(decimal Amount, string Card)> Charges { get; } = [];
    public List<(string Ref, decimal Amount)> Refunds { get; } = [];
    public Exception? ChargeFailure { get; set; }

    public Task<string> ChargeAsync(decimal amount, string cardNumber, string cardholder)
    {
        if (ChargeFailure is not null) throw ChargeFailure;
        Charges.Add((amount, cardNumber));
        return Task.FromResult("PAY-TEST");
    }

    public Task RefundAsync(string paymentReference, decimal amount)
    {
        Refunds.Add((paymentReference, amount));
        return Task.CompletedTask;
    }
}

public class FakeRepo : IOrderRepository
{
    public Quote NextQuote { get; set; } = new(20m, 0m, 1.6m, 0m, 21.6m, true);
    public OrderPayment? Payment { get; set; }
    public Exception? PlaceFailure { get; set; }
    public int PlacedCount { get; private set; }
    public List<string> Calls { get; } = [];

    public Task<Quote> QuoteAsync(IEnumerable<CartLine> items, string fulfillmentType, string? promoCode) => Task.FromResult(NextQuote);

    public Task<int> PlaceAsync(int userId, PlaceOrderRequest request, string paymentReference)
    {
        if (PlaceFailure is not null) throw PlaceFailure;
        PlacedCount++;
        return Task.FromResult(1001);
    }

    public Task<OrderPayment?> GetPaymentAsync(int orderId) => Task.FromResult(Payment);
    public Task UpdateStatusAsync(int orderId, string newStatus, int userId) { Calls.Add($"status:{newStatus}"); return Task.CompletedTask; }
    public Task CancelAsync(int orderId, int userId, bool isStaff) { Calls.Add("cancel"); return Task.CompletedTask; }
    public Task RefundAsync(int orderId, int userId) { Calls.Add("refund"); return Task.CompletedTask; }

    public Task<List<OrderSummary>> ListForUserAsync(int userId) => throw new NotImplementedException();
    public Task<List<KitchenOrder>> ListActiveAsync() => throw new NotImplementedException();
    public Task<List<OrderSummary>> ListRecentAsync(int count) => throw new NotImplementedException();
    public Task<OrderDetail?> GetAsync(int orderId) => throw new NotImplementedException();
    public Task<DailySalesReport> DailyReportAsync(DateOnly date) => throw new NotImplementedException();
}
