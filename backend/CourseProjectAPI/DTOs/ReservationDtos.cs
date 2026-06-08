namespace CourseProjectAPI.DTOs;

public class ReserveCarRequestDto
{
    public int UserId { get; set; }
    public int CarId { get; set; }
    public int? ConfigurationId { get; set; }
    public string? Color { get; set; }
    public List<int> OptionIds { get; set; } = new();
}

public class ReserveCarResponseDto
{
    public int OrderId { get; set; }
    public DateTime ReservedUntil { get; set; }
    public PricingQuoteDto Quote { get; set; } = new();
}

