IF OBJECT_ID('dbo.MenuTags') IS NULL
CREATE TABLE dbo.MenuTags (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(40) NOT NULL UNIQUE
);
GO
CREATE OR ALTER PROCEDURE dbo.usp_MenuSummary
AS
BEGIN
    SET NOCOUNT ON;
    SELECT c.Name AS Category, COUNT(m.Id) AS ItemCount, AVG(m.Price) AS AveragePrice
    FROM dbo.Categories c LEFT JOIN dbo.MenuItems m ON m.CategoryId = c.Id
    GROUP BY c.Name
    ORDER BY c.Name;
END;
GO
