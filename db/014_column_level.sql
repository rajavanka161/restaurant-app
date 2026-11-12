CREATE OR ALTER VIEW dbo.vw_MenuItemPrices
AS
SELECT Id, Name, Price
FROM dbo.MenuItems;
GO
CREATE OR ALTER PROCEDURE dbo.usp_SetPromoLimits
    @PromoId INT,
    @UsageLimit INT,
    @MaxDiscount DECIMAL(10,2)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Promos SET UsageLimit = @UsageLimit, MaxDiscount = @MaxDiscount WHERE Id = @PromoId;
END;
GO
IF COL_LENGTH('dbo.OrderItems', 'ExtendedPrice') IS NULL
ALTER TABLE dbo.OrderItems ADD ExtendedPrice AS (UnitPrice * Quantity);
GO
