using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services.Events;

namespace BurgerApi.Services;

public class OrderService(IOrderRepository repo, IPaymentGateway payments, IDiscountPolicy? discounts = null, IEventBus? events = null)
{
    private static readonly string[] Fulfillments = ["Pickup", "Delivery"];

    public static void ValidateFulfillment(string type)
    {
        if (!Fulfillments.Contains(type)) throw new DomainException("Fulfillment must be Pickup or Delivery.");
    }

    public static bool IsOpenStatus(string status) => status is "Received" or "Preparing" or "Ready";

    public Task<Quote> QuoteAsync(QuoteRequest r)
    {
        ValidateFulfillment(r.FulfillmentType);
        return repo.QuoteAsync(r.Items, r.FulfillmentType, r.PromoCode);
    }

    public async Task<int> PlaceOrderAsync(int userId, PlaceOrderRequest r)
    {
        ValidateFulfillment(r.FulfillmentType);
        if (r.FulfillmentType == "Delivery" && string.IsNullOrWhiteSpace(r.DeliveryAddress))
            throw new DomainException("Delivery address is required.");

        var quote = await repo.QuoteAsync(r.Items, r.FulfillmentType, r.PromoCode);
        if (quote.Subtotal <= 0) throw new DomainException("Cart has no available items.");
        if (!quote.PromoValid) throw new DomainException("Promo code is invalid or not applicable.");

        var charge = quote.Total - (discounts?.LoyaltyDiscount(quote.Subtotal) ?? 0m);
        var reference = await payments.ChargeAsync(charge, r.Payment.CardNumber, r.Payment.Name);
        int orderId;
        try
        {
            orderId = await repo.PlaceAsync(userId, r, reference);
        }
        catch
        {
            await payments.RefundAsync(reference, charge);
            throw;
        }
        if (events is not null) await events.PublishAsync(new OrderPlaced(orderId, userId, quote.Total));
        return orderId;
    }

    public async Task UpdateStatusAsync(int orderId, string requested, int staffUserId)
    {
        if (!Enum.TryParse<OrderStatus>(requested, true, out var next))
            throw new DomainException("Unknown status.");
        var order = await repo.GetPaymentAsync(orderId) ?? throw new DomainException("Order not found.", 404);
        var current = Enum.Parse<OrderStatus>(order.Status);
        if (!OrderStateMachine.CanAdvance(current, next))
            throw new DomainException($"Cannot move order from {current} to {next}.", 409);
        await repo.UpdateStatusAsync(orderId, next.ToString(), staffUserId);
    }

    public async Task CancelAsync(int orderId, int userId, bool isStaff)
    {
        var order = await repo.GetPaymentAsync(orderId) ?? throw new DomainException("Order not found.", 404);
        if (!isStaff && order.UserId != userId) throw new DomainException("Order not found.", 404);
        var status = Enum.Parse<OrderStatus>(order.Status);
        if (!OrderStateMachine.CanCancel(status, isStaff))
            throw new DomainException("This order can no longer be cancelled.", 409);
        await repo.CancelAsync(orderId, userId, isStaff);
        if (order.PaymentStatus == "Paid" && order.PaymentReference is not null)
            await payments.RefundAsync(order.PaymentReference, order.Total);
    }

    public async Task RefundAsync(int orderId, int managerUserId)
    {
        var order = await repo.GetPaymentAsync(orderId) ?? throw new DomainException("Order not found.", 404);
        if (order.PaymentStatus == "Refunded") throw new DomainException("Order is already refunded.", 409);
        await repo.RefundAsync(orderId, managerUserId);
        if (order.PaymentReference is not null)
            await payments.RefundAsync(order.PaymentReference, order.Total);
    }
}
