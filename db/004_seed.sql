IF NOT EXISTS (SELECT 1 FROM dbo.Categories)
BEGIN
    INSERT dbo.Categories (Name, SortOrder) VALUES ('Burgers',1),('Chicken',2),('Sides',3),('Drinks',4),('Desserts',5);

    INSERT dbo.Ingredients (Name, Unit, StockQty, ReorderLevel) VALUES
    ('Beef patty','pcs',200,40),('Chicken fillet','pcs',120,30),('Bun','pcs',400,80),('Cheddar slice','pcs',300,60),
    ('Bacon strip','pcs',250,50),('Lettuce','g',8000,1500),('Tomato','g',9000,1500),('Pickles','g',4000,800),
    ('Potato','g',40000,8000),('Cola syrup','ml',30000,5000),('Milk','ml',20000,4000),('Ice cream mix','ml',15000,3000),
    ('BBQ sauce','ml',6000,1000),('Special sauce','ml',8000,1500);

    INSERT dbo.MenuItems (CategoryId, Name, Description, Price, Emoji, Calories) VALUES
    (1,'Classic Smash',N'Double smashed beef, cheddar, pickles, special sauce.',8.99,N'🍔',720),
    (1,'Bacon Stack',N'Beef patty, crispy bacon, cheddar, BBQ sauce.',10.49,N'🥓',860),
    (1,'Garden Fresh',N'Beef patty, lettuce, tomato, pickles, special sauce.',7.99,N'🥬',610),
    (2,'Crispy Chicken Sandwich',N'Buttermilk fried fillet, pickles, special sauce.',9.49,N'🍗',690),
    (3,'Hand-cut Fries',N'Skin-on fries, salted.',3.99,N'🍟',410),
    (3,'Loaded Fries',N'Fries, cheddar, bacon, special sauce.',5.99,N'🧀',640),
    (4,'Cola',N'Fountain cola, free refills in store.',2.49,N'🥤',180),
    (4,'Vanilla Shake',N'Thick vanilla milkshake.',4.99,N'🥛',520),
    (5,'Soft Serve Cup',N'Vanilla soft serve.',2.99,N'🍦',230);

    INSERT dbo.MenuItemIngredients (MenuItemId, IngredientId, QtyPerItem)
    SELECT m.Id, i.Id, q.Qty FROM (VALUES
     ('Classic Smash','Beef patty',2),('Classic Smash','Bun',1),('Classic Smash','Cheddar slice',1),('Classic Smash','Pickles',20),('Classic Smash','Special sauce',20),
     ('Bacon Stack','Beef patty',1),('Bacon Stack','Bun',1),('Bacon Stack','Bacon strip',3),('Bacon Stack','Cheddar slice',1),('Bacon Stack','BBQ sauce',25),
     ('Garden Fresh','Beef patty',1),('Garden Fresh','Bun',1),('Garden Fresh','Lettuce',30),('Garden Fresh','Tomato',40),('Garden Fresh','Pickles',15),('Garden Fresh','Special sauce',20),
     ('Crispy Chicken Sandwich','Chicken fillet',1),('Crispy Chicken Sandwich','Bun',1),('Crispy Chicken Sandwich','Pickles',20),('Crispy Chicken Sandwich','Special sauce',20),
     ('Hand-cut Fries','Potato',200),
     ('Loaded Fries','Potato',200),('Loaded Fries','Cheddar slice',2),('Loaded Fries','Bacon strip',2),('Loaded Fries','Special sauce',15),
     ('Cola','Cola syrup',60),
     ('Vanilla Shake','Milk',250),('Vanilla Shake','Ice cream mix',150),
     ('Soft Serve Cup','Ice cream mix',120)
    ) q(Item, Ing, Qty)
    JOIN dbo.MenuItems m ON m.Name = q.Item JOIN dbo.Ingredients i ON i.Name = q.Ing;

    INSERT dbo.Promos (Code, DiscountType, Value, MinSubtotal, MaxDiscount) VALUES
    ('WELCOME10','Percent',10,0,NULL),
    ('BIGSAVER5','Fixed',5,25,NULL),
    ('FEAST20','Percent',20,40,15);
END
GO
