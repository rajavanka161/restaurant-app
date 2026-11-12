CREATE OR ALTER PROCEDURE dbo.usp_TopCustomers
    @Count INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Count) u.Id AS UserId, u.FullName, COUNT(o.Id) AS OrderCount, SUM(o.Total) AS TotalSpend
    FROM dbo.Users u JOIN dbo.Orders o ON o.UserId = u.Id
    WHERE o.Status <> 'Cancelled'
    GROUP BY u.Id, u.FullName
    ORDER BY SUM(o.Total) DESC;
END;
GO
