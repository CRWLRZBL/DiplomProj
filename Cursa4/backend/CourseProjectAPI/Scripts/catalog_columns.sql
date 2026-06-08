-- Расширение таблицы Cars для мультибрендового каталога (отдельная карточка на авто)
USE Autosalon;
GO

IF COL_LENGTH('dbo.Cars', 'ListingType') IS NULL
BEGIN
    ALTER TABLE dbo.Cars ADD ListingType NVARCHAR(10) NOT NULL CONSTRAINT DF_Cars_ListingType DEFAULT ('New');
END
GO

IF COL_LENGTH('dbo.Cars', 'CatalogBrand') IS NULL ALTER TABLE dbo.Cars ADD CatalogBrand NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogModel') IS NULL ALTER TABLE dbo.Cars ADD CatalogModel NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogTitle') IS NULL ALTER TABLE dbo.Cars ADD CatalogTitle NVARCHAR(300) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogBodyType') IS NULL ALTER TABLE dbo.Cars ADD CatalogBodyType NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogPrice') IS NULL ALTER TABLE dbo.Cars ADD CatalogPrice DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Cars', 'ShowPriceFrom') IS NULL ALTER TABLE dbo.Cars ADD ShowPriceFrom BIT NOT NULL CONSTRAINT DF_Cars_ShowPriceFrom DEFAULT (1);
IF COL_LENGTH('dbo.Cars', 'CatalogYear') IS NULL ALTER TABLE dbo.Cars ADD CatalogYear INT NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogFuelType') IS NULL ALTER TABLE dbo.Cars ADD CatalogFuelType NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogEngineCapacity') IS NULL ALTER TABLE dbo.Cars ADD CatalogEngineCapacity DECIMAL(6,2) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogTransmission') IS NULL ALTER TABLE dbo.Cars ADD CatalogTransmission NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogDriveType') IS NULL ALTER TABLE dbo.Cars ADD CatalogDriveType NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogTrim') IS NULL ALTER TABLE dbo.Cars ADD CatalogTrim NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogGeneration') IS NULL ALTER TABLE dbo.Cars ADD CatalogGeneration NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogCondition') IS NULL ALTER TABLE dbo.Cars ADD CatalogCondition NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogDescription') IS NULL ALTER TABLE dbo.Cars ADD CatalogDescription NVARCHAR(MAX) NULL;
IF COL_LENGTH('dbo.Cars', 'CatalogImageUrls') IS NULL ALTER TABLE dbo.Cars ADD CatalogImageUrls NVARCHAR(4000) NULL;
IF COL_LENGTH('dbo.Cars', 'TradeInDiscount') IS NULL ALTER TABLE dbo.Cars ADD TradeInDiscount DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Cars', 'CreditDiscount') IS NULL ALTER TABLE dbo.Cars ADD CreditDiscount DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Cars', 'IsPublished') IS NULL ALTER TABLE dbo.Cars ADD IsPublished BIT NOT NULL CONSTRAINT DF_Cars_IsPublished DEFAULT (1);
IF COL_LENGTH('dbo.Cars', 'ConfiguratorModelId') IS NULL ALTER TABLE dbo.Cars ADD ConfiguratorModelId INT NULL;
GO

-- ModelID необязателен для карточек без привязки к справочнику моделей
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Cars') AND name = 'ModelID' AND is_nullable = 0)
BEGIN
    ALTER TABLE dbo.Cars ALTER COLUMN ModelID INT NULL;
END
GO

-- Заполнить каталожные поля из справочника моделей для существующих записей
UPDATE c
SET
    CatalogBrand = b.BrandName,
    CatalogModel = m.ModelName,
    CatalogTitle = b.BrandName + N' ' + m.ModelName + N' ' + CAST(m.ModelYear AS NVARCHAR(4)),
    CatalogBodyType = m.BodyType,
    CatalogPrice = m.BasePrice,
    ShowPriceFrom = CASE WHEN c.ListingType = N'New' THEN 1 ELSE 0 END,
    CatalogYear = m.ModelYear,
    CatalogFuelType = m.FuelType,
    CatalogEngineCapacity = m.EngineCapacity,
    ListingType = CASE WHEN ISNULL(c.Mileage, 0) > 0 THEN N'Used' ELSE ISNULL(c.ListingType, N'New') END,
    ConfiguratorModelId = COALESCE(c.ConfiguratorModelId, c.ModelID)
FROM dbo.Cars c
INNER JOIN dbo.Models m ON c.ModelID = m.ModelID
INNER JOIN dbo.Brands b ON m.BrandID = b.BrandID
WHERE c.CatalogBrand IS NULL;
GO

PRINT 'Catalog columns ready.';
GO
