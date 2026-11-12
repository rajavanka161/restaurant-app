IF OBJECT_ID('dbo.OrderEventLog') IS NULL
CREATE TABLE dbo.OrderEventLog (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    UserId INT NOT NULL,
    Total DECIMAL(10,2) NOT NULL,
    RecordedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
CREATE OR ALTER PROCEDURE dbo.usp_RecordOrderEvent
    @OrderId INT,
    @UserId INT,
    @Total DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    INSERT dbo.OrderEventLog (OrderId, UserId, Total) VALUES (@OrderId, @UserId, @Total);
END;
GO
