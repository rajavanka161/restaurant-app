IF OBJECT_ID('dbo.syn_Ingredients', 'SN') IS NULL
CREATE SYNONYM dbo.syn_Ingredients FOR dbo.Ingredients;
GO
CREATE OR ALTER PROCEDURE dbo.usp_LowStockIngredients
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, StockQty, ReorderLevel
    FROM dbo.syn_Ingredients
    WHERE StockQty <= ReorderLevel
    ORDER BY Name;
END;
GO
