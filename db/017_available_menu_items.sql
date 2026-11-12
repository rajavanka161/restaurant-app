CREATE OR ALTER PROCEDURE dbo.usp_AvailableMenuItems
    @CategoryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, CategoryId, Name, Description, Price, Emoji, Calories, IsAvailable
    FROM dbo.MenuItems
    WHERE CategoryId = @CategoryId AND IsAvailable = 1
    ORDER BY Id;
END;
GO
