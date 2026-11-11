CREATE OR ALTER PROCEDURE dbo.usp_QuoteCart
    @Items dbo.OrderItemType READONLY,
    @FulfillmentType NVARCHAR(10),
    @PromoCode NVARCHAR(40) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @subtotal DECIMAL(10,2) = ISNULL((
        SELECT SUM(m.Price * i.Quantity)
        FROM @Items i JOIN dbo.MenuItems m ON m.Id = i.MenuItemId AND m.IsAvailable = 1), 0);
    DECLARE @discount DECIMAL(10,2) = CASE WHEN @PromoCode IS NULL THEN 0
        ELSE dbo.fn_PromoDiscount(@PromoCode, @subtotal, SYSUTCDATETIME()) END;
    DECLARE @after DECIMAL(10,2) = @subtotal - @discount;
    DECLARE @fee DECIMAL(10,2) = dbo.fn_DeliveryFee(@FulfillmentType, @after);
    DECLARE @tax DECIMAL(10,2) = dbo.fn_TaxAmount(@after);
    SELECT @subtotal AS Subtotal, @discount AS Discount, @tax AS Tax, @fee AS DeliveryFee,
           @after + @tax + @fee AS Total,
           CAST(CASE WHEN @PromoCode IS NOT NULL AND @discount = 0 THEN 0 ELSE 1 END AS BIT) AS PromoValid;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_PlaceOrder
    @UserId INT,
    @Items dbo.OrderItemType READONLY,
    @FulfillmentType NVARCHAR(10),
    @PromoCode NVARCHAR(40) = NULL,
    @DeliveryAddress NVARCHAR(300) = NULL,
    @Phone NVARCHAR(30) = NULL,
    @PaymentReference NVARCHAR(100) = NULL,
    @OrderId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;

    IF NOT EXISTS (SELECT 1 FROM @Items) THROW 50010, 'Cart is empty.', 1;
    IF EXISTS (SELECT 1 FROM @Items i LEFT JOIN dbo.MenuItems m ON m.Id = i.MenuItemId AND m.IsAvailable = 1
               WHERE m.Id IS NULL OR i.Quantity <= 0)
        THROW 50011, 'One or more items are unavailable.', 1;
    IF @FulfillmentType = 'Delivery' AND (@DeliveryAddress IS NULL OR LTRIM(RTRIM(@DeliveryAddress)) = '')
        THROW 50012, 'Delivery address is required.', 1;

    -- Lock and check ingredient stock
    DECLARE @short NVARCHAR(120);
    SELECT TOP 1 @short = g.Name
    FROM (SELECT ing.Id, ing.Name, ing.StockQty, SUM(mi.QtyPerItem * i.Quantity) AS Needed
          FROM @Items i
          JOIN dbo.MenuItemIngredients mi ON mi.MenuItemId = i.MenuItemId
          JOIN dbo.Ingredients ing WITH (UPDLOCK, ROWLOCK) ON ing.Id = mi.IngredientId
          GROUP BY ing.Id, ing.Name, ing.StockQty) g
    WHERE g.Needed > g.StockQty;
    IF @short IS NOT NULL
    BEGIN
        DECLARE @msg NVARCHAR(200) = CONCAT('Insufficient stock: ', @short);
        THROW 50013, @msg, 1;
    END

    UPDATE ing SET StockQty = ing.StockQty - n.Needed
    FROM dbo.Ingredients ing
    JOIN (SELECT mi.IngredientId, SUM(mi.QtyPerItem * i.Quantity) AS Needed
          FROM @Items i JOIN dbo.MenuItemIngredients mi ON mi.MenuItemId = i.MenuItemId
          GROUP BY mi.IngredientId) n ON n.IngredientId = ing.Id;

    DECLARE @subtotal DECIMAL(10,2) = (SELECT SUM(m.Price * i.Quantity)
        FROM @Items i JOIN dbo.MenuItems m ON m.Id = i.MenuItemId);
    DECLARE @discount DECIMAL(10,2) = 0;
    IF @PromoCode IS NOT NULL
    BEGIN
        SET @discount = dbo.fn_PromoDiscount(@PromoCode, @subtotal, SYSUTCDATETIME());
        IF @discount = 0 THROW 50014, 'Promo code is invalid or not applicable.', 1;
        UPDATE dbo.Promos SET UsedCount = UsedCount + 1 WHERE Code = @PromoCode;
    END
    DECLARE @after DECIMAL(10,2) = @subtotal - @discount;
    DECLARE @fee DECIMAL(10,2) = dbo.fn_DeliveryFee(@FulfillmentType, @after);
    DECLARE @tax DECIMAL(10,2) = dbo.fn_TaxAmount(@after);

    INSERT dbo.Orders (UserId, FulfillmentType, Status, PaymentStatus, Subtotal, Discount, Tax, DeliveryFee, Total,
                       PromoCode, DeliveryAddress, Phone, PaymentReference)
    VALUES (@UserId, @FulfillmentType, 'Received', 'Paid', @subtotal, @discount, @tax, @fee, @after + @tax + @fee,
            @PromoCode, @DeliveryAddress, @Phone, @PaymentReference);
    SET @OrderId = SCOPE_IDENTITY();

    INSERT dbo.OrderItems (OrderId, MenuItemId, Name, UnitPrice, Quantity, LineTotal)
    SELECT @OrderId, m.Id, m.Name, m.Price, i.Quantity, m.Price * i.Quantity
    FROM @Items i JOIN dbo.MenuItems m ON m.Id = i.MenuItemId;

    INSERT dbo.OrderStatusHistory (OrderId, Status, ChangedByUserId) VALUES (@OrderId, 'Received', @UserId);
    COMMIT;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_UpdateOrderStatus
    @OrderId INT,
    @NewStatus NVARCHAR(12),
    @ChangedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;
    DECLARE @cur NVARCHAR(12) = (SELECT Status FROM dbo.Orders WITH (UPDLOCK) WHERE Id = @OrderId);
    IF @cur IS NULL THROW 50020, 'Order not found.', 1;
    IF NOT ((@cur = 'Received' AND @NewStatus = 'Preparing')
         OR (@cur = 'Preparing' AND @NewStatus = 'Ready')
         OR (@cur = 'Ready' AND @NewStatus = 'Completed'))
        THROW 50021, 'Invalid status transition.', 1;
    UPDATE dbo.Orders SET Status = @NewStatus, UpdatedAt = SYSUTCDATETIME() WHERE Id = @OrderId;
    INSERT dbo.OrderStatusHistory (OrderId, Status, ChangedByUserId) VALUES (@OrderId, @NewStatus, @ChangedByUserId);
    COMMIT;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_CancelOrder
    @OrderId INT,
    @RequestedByUserId INT,
    @IsStaff BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;
    DECLARE @status NVARCHAR(12), @owner INT, @pay NVARCHAR(10);
    SELECT @status = Status, @owner = UserId, @pay = PaymentStatus FROM dbo.Orders WITH (UPDLOCK) WHERE Id = @OrderId;
    IF @status IS NULL THROW 50020, 'Order not found.', 1;
    IF @IsStaff = 0 AND @owner <> @RequestedByUserId THROW 50022, 'Not your order.', 1;
    IF @IsStaff = 0 AND @status <> 'Received' THROW 50023, 'Order can no longer be cancelled by the customer.', 1;
    IF @status IN ('Ready','Completed','Cancelled') THROW 50024, 'Order cannot be cancelled in its current status.', 1;

    UPDATE ing SET StockQty = ing.StockQty + r.Qty
    FROM dbo.Ingredients ing
    JOIN (SELECT mi.IngredientId, SUM(mi.QtyPerItem * oi.Quantity) AS Qty
          FROM dbo.OrderItems oi JOIN dbo.MenuItemIngredients mi ON mi.MenuItemId = oi.MenuItemId
          WHERE oi.OrderId = @OrderId GROUP BY mi.IngredientId) r ON r.IngredientId = ing.Id;

    UPDATE dbo.Orders SET Status = 'Cancelled', PaymentStatus = 'Refunded', UpdatedAt = SYSUTCDATETIME() WHERE Id = @OrderId;
    INSERT dbo.OrderStatusHistory (OrderId, Status, ChangedByUserId) VALUES (@OrderId, 'Cancelled', @RequestedByUserId);
    COMMIT;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_RefundOrder
    @OrderId INT,
    @ChangedByUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRAN;
    DECLARE @pay NVARCHAR(10) = (SELECT PaymentStatus FROM dbo.Orders WITH (UPDLOCK) WHERE Id = @OrderId);
    IF @pay IS NULL THROW 50020, 'Order not found.', 1;
    IF @pay = 'Refunded' THROW 50025, 'Order is already refunded.', 1;
    UPDATE dbo.Orders SET PaymentStatus = 'Refunded', UpdatedAt = SYSUTCDATETIME() WHERE Id = @OrderId;
    COMMIT;
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_DailySalesReport
    @Date DATE
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @Date AS SalesDate,
           ISNULL(MAX(OrderCount), 0) AS OrderCount,
           ISNULL(MAX(GrossSales), 0) AS GrossSales,
           ISNULL(MAX(RefundedAmount), 0) AS RefundedAmount,
           ISNULL(MAX(GrossSales), 0) - ISNULL(MAX(RefundedAmount), 0) AS NetSales,
           ISNULL(MAX(DiscountsGiven), 0) AS DiscountsGiven,
           ISNULL(MAX(CancelledCount), 0) AS CancelledCount
    FROM dbo.vw_DailySales WHERE SalesDate = @Date;

    SELECT TOP 10 oi.Name, SUM(oi.Quantity) AS Quantity, SUM(oi.LineTotal) AS Revenue
    FROM dbo.OrderItems oi JOIN dbo.Orders o ON o.Id = oi.OrderId
    WHERE CAST(o.CreatedAt AS DATE) = @Date AND o.Status <> 'Cancelled'
    GROUP BY oi.Name ORDER BY SUM(oi.Quantity) DESC;

    SELECT DATEPART(HOUR, o.CreatedAt) AS [Hour], COUNT(*) AS Orders, SUM(o.Total) AS Sales
    FROM dbo.Orders o
    WHERE CAST(o.CreatedAt AS DATE) = @Date AND o.Status <> 'Cancelled'
    GROUP BY DATEPART(HOUR, o.CreatedAt) ORDER BY [Hour];
END;
GO
