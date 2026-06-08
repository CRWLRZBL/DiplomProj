namespace CourseProjectAPI.DTOs;

public class ModelDto
{
    public int ModelId { get; set; }
    public string BrandName { get; set; } = null!;
    public string ModelName { get; set; } = null!;
    public string BodyType { get; set; } = null!;
    public decimal BasePrice { get; set; }
    public int ModelYear { get; set; }
    public string? FuelType { get; set; }
    public decimal? EngineCapacity { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; }
    public int AvailableCount { get; set; } // Количество доступных машин этой модели
}

