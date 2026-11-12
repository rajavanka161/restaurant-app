IF OBJECT_ID('dbo.PromoAudit') IS NULL
CREATE TABLE dbo.PromoAudit (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PromoId INT NOT NULL,
    OldIsActive BIT NOT NULL,
    NewIsActive BIT NOT NULL,
    OldUsedCount INT NOT NULL,
    NewUsedCount INT NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
CREATE OR ALTER TRIGGER dbo.trg_Promos_Audit
ON dbo.Promos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT dbo.PromoAudit (PromoId, OldIsActive, NewIsActive, OldUsedCount, NewUsedCount)
    SELECT i.Id, d.IsActive, i.IsActive, d.UsedCount, i.UsedCount
    FROM inserted i JOIN deleted d ON d.Id = i.Id
    WHERE i.IsActive <> d.IsActive OR i.UsedCount <> d.UsedCount;
END;
GO
