using BurgerApi.Contracts;
using BurgerApi.Domain;
using BurgerApi.Services;

namespace BurgerApi.Tests;

public class OrderServiceTests
{
    private readonly FakeRepo _repo = new();
    private readonly FakeGateway _gw = new();
    private OrderService Sut => new(_repo, _gw);

    private static PlaceOrderRequest Req(string type = "Pickup", string? address = null, string? promo = null) =>
        new([new CartLine(1, 2)], type, promo, address, null, new PaymentInfo("4242424242424242", "Casey"));

    [Fact]
    public async Task Place_charges_quoted_total_then_saves_order()
    {
        var id = await Sut.PlaceOrderAsync(7, Req());
        Assert.Equal(1001, id);
        Assert.Single(_gw.Charges);
        Assert.Equal(21.6m, _gw.Charges[0].Amount);
        Assert.Equal(1, _repo.PlacedCount);
    }

    [Fact]
    public async Task Declined_card_does_not_create_order()
    {
        _gw.ChargeFailure = new DomainException("Card was declined.", 402);
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req()));
        Assert.Equal(402, ex.StatusCode);
        Assert.Equal(0, _repo.PlacedCount);
    }

    [Fact]
    public async Task Failed_save_after_charge_refunds_the_customer()
    {
        _repo.PlaceFailure = new DomainException("Insufficient stock: Bun", 409);
        await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req()));
        Assert.Single(_gw.Refunds);
        Assert.Equal(21.6m, _gw.Refunds[0].Amount);
    }

    [Fact]
    public async Task Invalid_promo_is_rejected_before_charging()
    {
        _repo.NextQuote = _repo.NextQuote with { PromoValid = false };
        await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req(promo: "NOPE")));
        Assert.Empty(_gw.Charges);
    }

    [Fact]
    public async Task Empty_priced_cart_is_rejected()
    {
        _repo.NextQuote = new Quote(0, 0, 0, 0, 0, true);
        await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req()));
        Assert.Empty(_gw.Charges);
    }

    [Fact]
    public async Task Delivery_requires_address()
    {
        await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req("Delivery")));
        await Sut.PlaceOrderAsync(7, Req("Delivery", "1 Main St"));
        Assert.Equal(1, _repo.PlacedCount);
    }

    [Fact]
    public async Task Unknown_fulfillment_type_is_rejected() =>
        await Assert.ThrowsAsync<DomainException>(() => Sut.PlaceOrderAsync(7, Req("Drone")));

    [Fact]
    public async Task Kitchen_can_advance_order()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 10, "Paid", "Received");
        await Sut.UpdateStatusAsync(5, "preparing", 99);
        Assert.Equal(["status:Preparing"], _repo.Calls);
    }

    [Fact]
    public async Task Skipping_a_status_is_a_conflict()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 10, "Paid", "Received");
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.UpdateStatusAsync(5, "Ready", 99));
        Assert.Equal(409, ex.StatusCode);
        Assert.Empty(_repo.Calls);
    }

    [Fact]
    public async Task Unknown_status_and_missing_order_are_rejected()
    {
        await Assert.ThrowsAsync<DomainException>(() => Sut.UpdateStatusAsync(5, "Banana", 99));
        _repo.Payment = null;
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.UpdateStatusAsync(5, "Preparing", 99));
        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task Customer_cancels_received_order_and_is_refunded()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 12.5m, "Paid", "Received");
        await Sut.CancelAsync(5, 7, isStaff: false);
        Assert.Equal(["cancel"], _repo.Calls);
        Assert.Equal(("PAY-1", 12.5m), _gw.Refunds.Single());
    }

    [Fact]
    public async Task Customer_cannot_cancel_once_preparing()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 12.5m, "Paid", "Preparing");
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.CancelAsync(5, 7, false));
        Assert.Equal(409, ex.StatusCode);
        Assert.Empty(_gw.Refunds);
    }

    [Fact]
    public async Task Customer_cannot_cancel_someone_elses_order()
    {
        _repo.Payment = new OrderPayment(8, "PAY-1", 12.5m, "Paid", "Received");
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.CancelAsync(5, 7, false));
        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task Staff_can_cancel_preparing_order()
    {
        _repo.Payment = new OrderPayment(8, "PAY-1", 12.5m, "Paid", "Preparing");
        await Sut.CancelAsync(5, 99, isStaff: true);
        Assert.Contains("cancel", _repo.Calls);
    }

    [Fact]
    public async Task Refund_marks_order_and_returns_money_once()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 30m, "Paid", "Completed");
        await Sut.RefundAsync(5, 99);
        Assert.Equal(["refund"], _repo.Calls);
        Assert.Single(_gw.Refunds);
    }

    [Fact]
    public async Task Refunding_twice_is_a_conflict()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 30m, "Refunded", "Completed");
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.RefundAsync(5, 99));
        Assert.Equal(409, ex.StatusCode);
        Assert.Empty(_gw.Refunds);
    }

    private static MenuItemDto Menu(int id, string name, bool available = true) =>
        new(id, 1, "Burgers", name, "", 8.99m, "🍔", null, available);

    [Fact]
    public async Task Reorder_splits_available_lines_from_unavailable_ones()
    {
        _repo.Payment = new OrderPayment(7, "PAY-1", 30m, "Paid", "Completed");
        _repo.Candidates =
        [
            new ReorderCandidate("Classic Smash", 2, Menu(1, "Classic Smash")),
            new ReorderCandidate("Shake", 1, Menu(9, "Shake", available: false)),
            new ReorderCandidate("Retired Burger", 1, null),
        ];
        var result = await Sut.ReorderAsync(5, 7);
        var line = Assert.Single(result.Available);
        Assert.Equal(2, line.Quantity);
        Assert.Equal(["Shake", "Retired Burger"], result.Unavailable);
    }

    [Fact]
    public async Task Reorder_of_someone_elses_order_is_not_found()
    {
        _repo.Payment = new OrderPayment(8, "PAY-1", 30m, "Paid", "Completed");
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.ReorderAsync(5, 7));
        Assert.Equal(404, ex.StatusCode);
    }

    [Fact]
    public async Task Reorder_of_unknown_order_is_not_found()
    {
        _repo.Payment = null;
        var ex = await Assert.ThrowsAsync<DomainException>(() => Sut.ReorderAsync(5, 7));
        Assert.Equal(404, ex.StatusCode);
    }
}
