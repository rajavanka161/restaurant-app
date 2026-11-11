IF OBJECT_ID('dbo.OrdersArchive') IS NULL
CREATE TABLE dbo.OrdersArchive (
    Id INT NOT NULL PRIMARY KEY,
    UserId INT NOT NULL,
    Status NVARCHAR(12) NOT NULL,
    Total DECIMAL(10,2) NOT NULL,
    CreatedAt DATETIME2 NOT NULL,
    ArchivedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
CREATE OR ALTER PROCEDURE dbo.usp_ArchiveOldOrders
    @OlderThanDays INT,
    @ArchiveTable SYSNAME = N'OrdersArchive'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @cutoff DATETIME2 = DATEADD(DAY, -@OlderThanDays, SYSUTCDATETIME());
    DECLARE @target NVARCHAR(300) = N'dbo.' + QUOTENAME(@ArchiveTable);
    DECLARE @sql NVARCHAR(MAX) = N'
        INSERT INTO ' + @target + N' (Id, UserId, Status, Total, CreatedAt)
        SELECT o.Id, o.UserId, o.Status, o.Total, o.CreatedAt
        FROM dbo.Orders o
        WHERE o.Status IN (''Completed'', ''Cancelled'') AND o.CreatedAt < @cutoff
          AND NOT EXISTS (SELECT 1 FROM ' + @target + N' a WHERE a.Id = o.Id);';
    EXEC sp_executesql @sql, N'@cutoff DATETIME2', @cutoff = @cutoff;
    SELECT @@ROWCOUNT AS ArchivedCount;
END;
GO
