CREATE OR ALTER FUNCTION dbo.fn_PromoDiscount(@Code NVARCHAR(40), @Subtotal DECIMAL(10,2), @Now DATETIME2)
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @d DECIMAL(10,2) = 0;
    SELECT @d = CASE
            WHEN p.DiscountType = 'Percent' THEN ROUND(@Subtotal * p.Value / 100.0, 2)
            ELSE p.Value END
    FROM dbo.Promos p
    WHERE p.Code = @Code AND p.IsActive = 1
      AND (p.ExpiresAt IS NULL OR p.ExpiresAt > @Now)
      AND (p.UsageLimit IS NULL OR p.UsedCount < p.UsageLimit)
      AND @Subtotal >= p.MinSubtotal;
    DECLARE @max DECIMAL(10,2) = (SELECT MaxDiscount FROM dbo.Promos WHERE Code = @Code);
    IF @max IS NOT NULL AND @d > @max SET @d = @max;
    IF @d > @Subtotal SET @d = @Subtotal;
    RETURN ISNULL(@d, 0);
END;
GO
CREATE OR ALTER FUNCTION dbo.fn_TaxAmount(@TaxableAmount DECIMAL(10,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN ROUND(@TaxableAmount * 0.08, 2);
END;
GO
CREATE OR ALTER FUNCTION dbo.fn_DeliveryFee(@Fulfillment NVARCHAR(10), @SubtotalAfterDiscount DECIMAL(10,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    RETURN CASE WHEN @Fulfillment = 'Delivery' AND @SubtotalAfterDiscount < 30 THEN 3.99 ELSE 0 END;
END;
GO
CREATE OR ALTER VIEW dbo.vw_OrderSummary
AS
SELECT o.Id, o.UserId, u.FullName AS CustomerName, o.FulfillmentType, o.Status, o.PaymentStatus,
       o.Subtotal, o.Discount, o.Tax, o.DeliveryFee, o.Total, o.PromoCode,
       o.DeliveryAddress, o.Phone, o.CreatedAt, o.UpdatedAt,
       (SELECT SUM(Quantity) FROM dbo.OrderItems oi WHERE oi.OrderId = o.Id) AS ItemCount
FROM dbo.Orders o JOIN dbo.Users u ON u.Id = o.UserId;
GO
CREATE OR ALTER VIEW dbo.vw_DailySales
AS
SELECT CAST(o.CreatedAt AS DATE) AS SalesDate,
       COUNT(*) AS OrderCount,
       SUM(CASE WHEN o.Status <> 'Cancelled' THEN o.Total ELSE 0 END) AS GrossSales,
       SUM(CASE WHEN o.Status <> 'Cancelled' AND o.PaymentStatus = 'Refunded' THEN o.Total ELSE 0 END) AS RefundedAmount,
       SUM(CASE WHEN o.Status <> 'Cancelled' THEN o.Discount ELSE 0 END) AS DiscountsGiven,
       SUM(CASE WHEN o.Status = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledCount
FROM dbo.Orders o
GROUP BY CAST(o.CreatedAt AS DATE);
GO
CREATE OR ALTER VIEW dbo.vw_LowStock
AS
SELECT Id, Name, Unit, StockQty, ReorderLevel
FROM dbo.Ingredients
WHERE StockQty <= ReorderLevel;
GO
