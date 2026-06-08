using CourseProjectAPI.DTOs;
using CourseProjectAPI.Models;

namespace CourseProjectAPI.Services;

internal static class CarMapping
{
    public static CarDto ToDto(Car c)
    {
        var brand = c.CatalogBrand ?? c.Model?.Brand?.BrandName ?? "";
        var model = c.CatalogModel ?? c.Model?.ModelName ?? "";
        var title = !string.IsNullOrWhiteSpace(c.CatalogTitle)
            ? c.CatalogTitle!
            : $"{brand} {model}".Trim();
        var price = c.CatalogPrice ?? c.Model?.BasePrice ?? 0;
        var tradeIn = c.TradeInDiscount ?? 0;
        var credit = c.CreditDiscount ?? 0;
        var maxDiscount = tradeIn + credit;
        var imageUrls = ParseImageUrls(c);

        return new CarDto
        {
            CarId = c.CarId,
            ModelId = c.ModelId,
            ConfiguratorModelId = c.ConfiguratorModelId ?? c.ModelId,
            ListingType = string.IsNullOrWhiteSpace(c.ListingType) ? "New" : c.ListingType,
            BrandName = brand,
            ModelName = model,
            Title = title,
            BodyType = c.CatalogBodyType ?? c.Model?.BodyType ?? "",
            BasePrice = price,
            ShowPriceFrom = c.ListingType != "Used",
            Color = c.Color,
            Status = c.Status,
            Vin = c.Vin,
            Mileage = c.Mileage,
            ModelYear = c.CatalogYear ?? c.Model?.ModelYear ?? 0,
            FuelType = c.CatalogFuelType ?? c.Model?.FuelType ?? "",
            EngineCapacity = c.CatalogEngineCapacity ?? c.Model?.EngineCapacity,
            Transmission = c.CatalogTransmission,
            DriveType = c.CatalogDriveType,
            Trim = c.CatalogTrim,
            Generation = c.CatalogGeneration,
            Condition = c.CatalogCondition ?? (c.Mileage > 0 ? "С пробегом" : "Новый"),
            Description = c.CatalogDescription,
            ImageUrl = c.ImageUrl ?? imageUrls.FirstOrDefault() ?? c.Model?.ImageUrl,
            ImageUrls = imageUrls,
            TradeInDiscount = c.TradeInDiscount,
            CreditDiscount = c.CreditDiscount,
            IsPublished = c.IsPublished,
            MaxDiscount = maxDiscount > 0 ? maxDiscount : null,
            PriceWithDiscounts = maxDiscount > 0 ? Math.Max(0, price - maxDiscount) : null,
        };
    }

    public static void ApplySaveDto(Car car, SaveCarListingDto dto)
    {
        car.ListingType = dto.ListingType == "Used" ? "Used" : "New";
        car.CatalogBrand = dto.BrandName.Trim();
        car.CatalogModel = dto.ModelName.Trim();
        car.CatalogTitle = string.IsNullOrWhiteSpace(dto.Title)
            ? $"{dto.BrandName} {dto.ModelName}".Trim()
            : dto.Title.Trim();
        car.CatalogBodyType = dto.BodyType?.Trim();
        car.CatalogPrice = dto.BasePrice;
        car.ShowPriceFrom = car.ListingType != "Used";
        car.Color = dto.Color?.Trim() ?? "Не указан";
        car.Status = dto.Status?.Trim() ?? "Available";
        car.Vin = string.IsNullOrWhiteSpace(dto.Vin)
            ? Guid.NewGuid().ToString("N")[..17]
            : dto.Vin.Trim()[..Math.Min(17, dto.Vin.Trim().Length)];
        car.Mileage = dto.Mileage ?? (car.ListingType == "Used" ? 1 : 0);
        car.CatalogYear = dto.ModelYear;
        car.CatalogFuelType = dto.FuelType?.Trim();
        car.CatalogEngineCapacity = dto.EngineCapacity;
        car.CatalogTransmission = dto.Transmission?.Trim();
        car.CatalogDriveType = dto.DriveType?.Trim();
        car.CatalogTrim = dto.Trim?.Trim();
        car.CatalogGeneration = dto.Generation?.Trim();
        car.CatalogCondition = dto.Condition?.Trim()
            ?? (car.ListingType == "Used" ? "С пробегом" : "Новый");
        car.CatalogDescription = dto.Description?.Trim();
        car.TradeInDiscount = dto.TradeInDiscount;
        car.CreditDiscount = dto.CreditDiscount;
        car.IsPublished = dto.IsPublished;
        car.ConfiguratorModelId = dto.ConfiguratorModelId;
        car.ModelId = dto.ConfiguratorModelId;

        var urls = (dto.ImageUrls ?? new List<string>())
            .Where(u => !string.IsNullOrWhiteSpace(u))
            .Select(u => u.Trim())
            .ToList();
        if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
            urls.Insert(0, dto.ImageUrl.Trim());
        car.CatalogImageUrls = urls.Count > 0 ? string.Join("|", urls.Distinct()) : null;
        car.ImageUrl = urls.FirstOrDefault();
    }

    public static List<string> ParseImageUrls(Car c)
    {
        var urls = new List<string>();
        if (!string.IsNullOrWhiteSpace(c.CatalogImageUrls))
            urls.AddRange(c.CatalogImageUrls.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
        if (!string.IsNullOrWhiteSpace(c.ImageUrl) && !urls.Contains(c.ImageUrl))
            urls.Insert(0, c.ImageUrl);
        if (urls.Count == 0 && !string.IsNullOrWhiteSpace(c.Model?.ImageUrl))
            urls.Add(c.Model.ImageUrl);
        return urls;
    }
}
