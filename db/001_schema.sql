IF OBJECT_ID('dbo.Categories') IS NULL
CREATE TABLE dbo.Categories (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(80) NOT NULL,
    SortOrder INT NOT NULL DEFAULT 0
);
GO
IF OBJECT_ID('dbo.MenuItems') IS NULL
CREATE TABLE dbo.MenuItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CategoryId INT NOT NULL REFERENCES dbo.Categories(Id),
    Name NVARCHAR(120) NOT NULL,
    Description NVARCHAR(500) NOT NULL DEFAULT '',
    Price DECIMAL(10,2) NOT NULL CHECK (Price >= 0),
    Emoji NVARCHAR(8) NOT NULL DEFAULT N'🍔',
    Calories INT NULL,
    IsAvailable BIT NOT NULL DEFAULT 1
);
GO
IF OBJECT_ID('dbo.Ingredients') IS NULL
CREATE TABLE dbo.Ingredients (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(120) NOT NULL UNIQUE,
    Unit NVARCHAR(20) NOT NULL DEFAULT 'unit',
    StockQty DECIMAL(12,2) NOT NULL CHECK (StockQty >= 0),
    ReorderLevel DECIMAL(12,2) NOT NULL DEFAULT 0
);
GO
IF OBJECT_ID('dbo.MenuItemIngredients') IS NULL
CREATE TABLE dbo.MenuItemIngredients (
    MenuItemId INT NOT NULL REFERENCES dbo.MenuItems(Id) ON DELETE CASCADE,
    IngredientId INT NOT NULL REFERENCES dbo.Ingredients(Id),
    QtyPerItem DECIMAL(12,2) NOT NULL CHECK (QtyPerItem > 0),
    PRIMARY KEY (MenuItemId, IngredientId)
);
GO
IF OBJECT_ID('dbo.Promos') IS NULL
CREATE TABLE dbo.Promos (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Code NVARCHAR(40) NOT NULL UNIQUE,
    DiscountType NVARCHAR(10) NOT NULL CHECK (DiscountType IN ('Percent','Fixed')),
    Value DECIMAL(10,2) NOT NULL CHECK (Value > 0),
    MinSubtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    MaxDiscount DECIMAL(10,2) NULL,
    ExpiresAt DATETIME2 NULL,
    UsageLimit INT NULL,
    UsedCount INT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1
);
GO
IF OBJECT_ID('dbo.Users') IS NULL
CREATE TABLE dbo.Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    FullName NVARCHAR(120) NOT NULL,
    PasswordHash NVARCHAR(300) NOT NULL,
    Role NVARCHAR(20) NOT NULL CHECK (Role IN ('Customer','Kitchen','Manager'))
);
GO
IF OBJECT_ID('dbo.Orders') IS NULL
CREATE TABLE dbo.Orders (
    Id INT IDENTITY(1000,1) PRIMARY KEY,
    UserId INT NOT NULL REFERENCES dbo.Users(Id),
    FulfillmentType NVARCHAR(10) NOT NULL CHECK (FulfillmentType IN ('Pickup','Delivery')),
    Status NVARCHAR(12) NOT NULL CHECK (Status IN ('Received','Preparing','Ready','Completed','Cancelled')),
    PaymentStatus NVARCHAR(10) NOT NULL CHECK (PaymentStatus IN ('Paid','Refunded')),
    Subtotal DECIMAL(10,2) NOT NULL,
    Discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    Tax DECIMAL(10,2) NOT NULL,
    DeliveryFee DECIMAL(10,2) NOT NULL DEFAULT 0,
    Total DECIMAL(10,2) NOT NULL,
    PromoCode NVARCHAR(40) NULL,
    DeliveryAddress NVARCHAR(300) NULL,
    Phone NVARCHAR(30) NULL,
    PaymentReference NVARCHAR(100) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO
IF OBJECT_ID('dbo.OrderItems') IS NULL
CREATE TABLE dbo.OrderItems (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL REFERENCES dbo.Orders(Id),
    MenuItemId INT NOT NULL REFERENCES dbo.MenuItems(Id),
    Name NVARCHAR(120) NOT NULL,
    UnitPrice DECIMAL(10,2) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    LineTotal DECIMAL(10,2) NOT NULL
);
GO
IF OBJECT_ID('dbo.OrderStatusHistory') IS NULL
CREATE TABLE dbo.OrderStatusHistory (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    OrderId INT NOT NULL REFERENCES dbo.Orders(Id),
    Status NVARCHAR(12) NOT NULL,
    ChangedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ChangedByUserId INT NULL
);
GO
IF TYPE_ID('dbo.OrderItemType') IS NULL
CREATE TYPE dbo.OrderItemType AS TABLE (MenuItemId INT NOT NULL, Quantity INT NOT NULL);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_Status_CreatedAt')
CREATE INDEX IX_Orders_Status_CreatedAt ON dbo.Orders(Status, CreatedAt);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_UserId')
CREATE INDEX IX_Orders_UserId ON dbo.Orders(UserId, CreatedAt DESC);
GO
