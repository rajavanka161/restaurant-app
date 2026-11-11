using System.Data;
using BurgerApi.Contracts;
using BurgerApi.Domain;
using Dapper;
using Microsoft.Data.SqlClient;

namespace BurgerApi.Services;

public class OrderRepository(IConfiguration config) : IOrderRepository
{
    private readonly string _cs = config.GetConnectionString("Default")!;

    private SqlConnection Open() => new(_cs);

    private static DataTable ToTvp(IEnumerable<CartLine> items)
    {
        var t = new DataTable();
        t.Columns.Add("MenuItemId", typeof(int));
        t.Columns.Add("Quantity", typeof(int));
        foreach (var g in items.GroupBy(i => i.MenuItemId))
            t.Rows.Add(g.Key, g.Sum(x => x.Quantity));
        return t;
    }

    private static DomainException Map(SqlException ex)
    {
        var status = ex.Number switch
        {
            50020 => 404,
            50022 => 403,
            50023 or 50024 or 50025 or 50021 or 50013 => 409,
            _ => 400
        };
        return new DomainException(ex.Message, status);
    }

    private static async Task<T> Guard<T>(Func<Task<T>> action)
    {
        try { return await action(); }
        catch (SqlException ex) when (ex.Number is >= 50010 and <= 50025) { throw Map(ex); }
    }

    public Task<Quote> QuoteAsync(IEnumerable<CartLine> items, string fulfillmentType, string? promoCode) => Guard(async () =>
    {
        await using var c = Open();
        var p = new DynamicParameters();
        p.Add("Items", ToTvp(items).AsTableValuedParameter("dbo.OrderItemType"));
        p.Add("FulfillmentType", fulfillmentType);
        p.Add("PromoCode", string.IsNullOrWhiteSpace(promoCode) ? null : promoCode.Trim().ToUpperInvariant());
        return await c.QuerySingleAsync<Quote>("dbo.usp_QuoteCart", p, commandType: CommandType.StoredProcedure);
    });

    public Task<int> PlaceAsync(int userId, PlaceOrderRequest r, string paymentReference) => Guard(async () =>
    {
        await using var c = Open();
        var p = new DynamicParameters();
        p.Add("UserId", userId);
        p.Add("Items", ToTvp(r.Items).AsTableValuedParameter("dbo.OrderItemType"));
        p.Add("FulfillmentType", r.FulfillmentType);
        p.Add("PromoCode", string.IsNullOrWhiteSpace(r.PromoCode) ? null : r.PromoCode.Trim().ToUpperInvariant());
        p.Add("DeliveryAddress", r.DeliveryAddress);
        p.Add("Phone", r.Phone);
        p.Add("PaymentReference", paymentReference);
        p.Add("OrderId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        await c.ExecuteAsync("dbo.usp_PlaceOrder", p, commandType: CommandType.StoredProcedure);
        return p.Get<int>("OrderId");
    });

    public async Task<List<OrderSummary>> ListForUserAsync(int userId)
    {
        await using var c = Open();
        return (await c.QueryAsync<OrderSummary>(
            "SELECT * FROM dbo.vw_OrderSummary WHERE UserId = @userId ORDER BY CreatedAt DESC", new { userId })).ToList();
    }

    public async Task<List<KitchenOrder>> ListActiveAsync()
    {
        await using var c = Open();
        var orders = (await c.QueryAsync<OrderSummary>(
            "SELECT * FROM dbo.vw_OrderSummary WHERE Status IN ('Received','Preparing','Ready') ORDER BY CreatedAt")).ToList();
        if (orders.Count == 0) return [];
        var lines = await c.QueryAsync<(int OrderId, string Name, decimal UnitPrice, int Quantity, decimal LineTotal)>(
            "SELECT OrderId, Name, UnitPrice, Quantity, LineTotal FROM dbo.OrderItems WHERE OrderId IN @ids",
            new { ids = orders.Select(o => o.Id).ToArray() });
        var byOrder = lines.ToLookup(l => l.OrderId, l => new OrderLine(l.Name, l.UnitPrice, l.Quantity, l.LineTotal));
        return orders.Select(o => new KitchenOrder(o, byOrder[o.Id].ToList())).ToList();
    }

    public async Task<List<OrderSummary>> ListRecentAsync(int count)
    {
        await using var c = Open();
        return (await c.QueryAsync<OrderSummary>(
            "SELECT TOP (@count) * FROM dbo.vw_OrderSummary ORDER BY CreatedAt DESC", new { count })).ToList();
    }

    public async Task<OrderDetail?> GetAsync(int orderId)
    {
        await using var c = Open();
        var order = await c.QuerySingleOrDefaultAsync<OrderSummary>(
            "SELECT * FROM dbo.vw_OrderSummary WHERE Id = @orderId", new { orderId });
        if (order is null) return null;
        var items = (await c.QueryAsync<OrderLine>(
            "SELECT Name, UnitPrice, Quantity, LineTotal FROM dbo.OrderItems WHERE OrderId = @orderId", new { orderId })).ToList();
        var history = (await c.QueryAsync<StatusEntry>(
            "SELECT Status, ChangedAt FROM dbo.OrderStatusHistory WHERE OrderId = @orderId ORDER BY ChangedAt, Id", new { orderId })).ToList();
        return new OrderDetail(order, items, history);
    }

    public async Task<OrderPayment?> GetPaymentAsync(int orderId)
    {
        await using var c = Open();
        return await c.QuerySingleOrDefaultAsync<OrderPayment>(
            "SELECT UserId, PaymentReference, Total, PaymentStatus, Status FROM dbo.Orders WHERE Id = @orderId", new { orderId });
    }

    public Task UpdateStatusAsync(int orderId, string newStatus, int userId) => Guard<int>(async () =>
    {
        await using var c = Open();
        await c.ExecuteAsync("dbo.usp_UpdateOrderStatus",
            new { OrderId = orderId, NewStatus = newStatus, ChangedByUserId = userId }, commandType: CommandType.StoredProcedure);
        return 0;
    });

    public Task CancelAsync(int orderId, int userId, bool isStaff) => Guard<int>(async () =>
    {
        await using var c = Open();
        await c.ExecuteAsync("dbo.usp_CancelOrder",
            new { OrderId = orderId, RequestedByUserId = userId, IsStaff = isStaff }, commandType: CommandType.StoredProcedure);
        return 0;
    });

    public Task RefundAsync(int orderId, int userId) => Guard<int>(async () =>
    {
        await using var c = Open();
        await c.ExecuteAsync("dbo.usp_RefundOrder",
            new { OrderId = orderId, ChangedByUserId = userId }, commandType: CommandType.StoredProcedure);
        return 0;
    });

    public async Task<DailySalesReport> DailyReportAsync(DateOnly date)
    {
        await using var c = Open();
        using var multi = await c.QueryMultipleAsync("dbo.usp_DailySalesReport",
            new { Date = date.ToDateTime(TimeOnly.MinValue) }, commandType: CommandType.StoredProcedure);
        var summary = await multi.ReadSingleAsync<SalesSummary>();
        var top = (await multi.ReadAsync<TopItem>()).ToList();
        var hourly = (await multi.ReadAsync<HourlySales>()).ToList();
        return new DailySalesReport(summary, top, hourly);
    }
}
