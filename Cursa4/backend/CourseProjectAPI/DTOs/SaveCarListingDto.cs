namespace CourseProjectAPI.DTOs
{
    public class SaveCarListingDto
    {
        public string ListingType { get; set; } = "New";
        public string BrandName { get; set; } = "";
        public string ModelName { get; set; } = "";
        public string? Title { get; set; }
        public string? BodyType { get; set; }
        public decimal BasePrice { get; set; }
        public bool ShowPriceFrom { get; set; } = true;
        public string Color { get; set; } = "Не указан";
        public string Status { get; set; } = "Available";
        public string? Vin { get; set; }
        public int? Mileage { get; set; }
        public int? ModelYear { get; set; }
        public string? FuelType { get; set; }
        public decimal? EngineCapacity { get; set; }
        public string? Transmission { get; set; }
        public string? DriveType { get; set; }
        public string? Trim { get; set; }
        public string? Generation { get; set; }
        public string? Condition { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public List<string>? ImageUrls { get; set; }
        public decimal? TradeInDiscount { get; set; }
        public decimal? CreditDiscount { get; set; }
        public bool IsPublished { get; set; } = true;
        public int? ConfiguratorModelId { get; set; }
    }
}
