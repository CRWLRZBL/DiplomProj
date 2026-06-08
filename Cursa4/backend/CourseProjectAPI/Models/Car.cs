using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class Car
{
    public int CarId { get; set; }

    public int? ModelId { get; set; }

    public string Vin { get; set; } = null!;

    public string Color { get; set; } = null!;

    public DateOnly? ProductionDate { get; set; }

    public int? Mileage { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public string? ImageUrl { get; set; }

    public string ListingType { get; set; } = "New";

    public string? CatalogBrand { get; set; }

    public string? CatalogModel { get; set; }

    public string? CatalogTitle { get; set; }

    public string? CatalogBodyType { get; set; }

    public decimal? CatalogPrice { get; set; }

    public bool ShowPriceFrom { get; set; } = true;

    public int? CatalogYear { get; set; }

    public string? CatalogFuelType { get; set; }

    public decimal? CatalogEngineCapacity { get; set; }

    public string? CatalogTransmission { get; set; }

    public string? CatalogDriveType { get; set; }

    public string? CatalogTrim { get; set; }

    public string? CatalogGeneration { get; set; }

    public string? CatalogCondition { get; set; }

    public string? CatalogDescription { get; set; }

    public string? CatalogImageUrls { get; set; }

    public decimal? TradeInDiscount { get; set; }

    public decimal? CreditDiscount { get; set; }

    public bool IsPublished { get; set; } = true;

    public int? ConfiguratorModelId { get; set; }

    public virtual Model? Model { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
