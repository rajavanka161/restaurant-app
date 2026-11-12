IF OBJECT_ID('dbo.OrderNotes') IS NULL
CREATE TABLE dbo.OrderNotes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL,
    AuthorUserId INT NOT NULL,
    Text NVARCHAR(500) NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_OrderNotes_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id),
    CONSTRAINT FK_OrderNotes_Users FOREIGN KEY (AuthorUserId) REFERENCES dbo.Users(Id)
);
GO
IF OBJECT_ID('dbo.MenuItemReviews') IS NULL
CREATE TABLE dbo.MenuItemReviews (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    MenuItemId INT NOT NULL,
    UserId INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_MenuItemReviews_MenuItems FOREIGN KEY (MenuItemId) REFERENCES dbo.MenuItems(Id),
    CONSTRAINT FK_MenuItemReviews_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id)
);
GO
