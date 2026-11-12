CREATE OR ALTER PROCEDURE dbo.usp_OrderCountForUser
    @UserId INT,
    @Count INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @Count = COUNT(*) FROM dbo.Orders WHERE UserId = @UserId AND Status <> 'Cancelled';
END;
GO
CREATE OR ALTER PROCEDURE dbo.usp_CustomerSpend
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @count INT;
    EXEC dbo.usp_OrderCountForUser @UserId = @UserId, @Count = @count OUTPUT;
    DECLARE @spend DECIMAL(10,2) = ISNULL((SELECT SUM(Total) FROM dbo.Orders WHERE UserId = @UserId AND Status <> 'Cancelled'), 0);
    SELECT @count AS OrderCount, @spend AS TotalSpend, dbo.fn_TaxAmount(@spend) AS TaxOnSpend;
END;
GO
