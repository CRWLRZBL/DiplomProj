using Microsoft.EntityFrameworkCore;

namespace CourseProjectAPI.Data;

public static class CatalogSchemaBootstrap
{
    public static async Task EnsureColumnsAsync(AutoSalonContext context, ILogger logger, CancellationToken ct = default)
    {
        const string sql = """
            IF DB_ID('Autosalon') IS NULL
                RETURN;

            IF COL_LENGTH('dbo.Cars', 'ListingType') IS NULL
                ALTER TABLE dbo.Cars ADD ListingType NVARCHAR(10) NOT NULL CONSTRAINT DF_Cars_ListingType DEFAULT ('New');

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
            """;

        try
        {
            await context.Database.ExecuteSqlRawAsync(sql, ct);
            logger.LogInformation("Catalog schema bootstrap completed.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to ensure catalog columns.");
            throw;
        }
    }
}
