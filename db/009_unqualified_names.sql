CREATE OR ALTER VIEW dbo.vw_OrderTotalsByStatus
AS
SELECT Status, COUNT(*) AS OrderCount, SUM(Total) AS Revenue
FROM Orders
GROUP BY Status;
GO
CREATE OR ALTER PROCEDURE dbo.usp_OrderItemCount
    @OrderId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT COUNT(*) AS ItemLines
    FROM dbo.OrderItems oi JOIN Orders o ON o.Id = oi.OrderId
    WHERE o.Id = @OrderId;
END;
GO
