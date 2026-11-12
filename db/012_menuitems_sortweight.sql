IF COL_LENGTH('dbo.MenuItems', 'SortWeight') IS NULL
ALTER TABLE dbo.MenuItems ADD SortWeight INT NOT NULL CONSTRAINT DF_MenuItems_SortWeight DEFAULT 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_MenuItems_SortWeight')
ALTER TABLE dbo.MenuItems ADD CONSTRAINT CK_MenuItems_SortWeight CHECK (SortWeight BETWEEN 0 AND 1000);
GO
