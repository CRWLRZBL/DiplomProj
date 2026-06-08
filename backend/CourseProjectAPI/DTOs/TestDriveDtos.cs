namespace CourseProjectAPI.DTOs;

public class TestDriveSlotDto
{
    public DateTime StartsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
}

public class BookTestDriveRequestDto
{
    public int UserId { get; set; }
    public int CarId { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public string RouteType { get; set; } = "city"; // city | highway | offroad
    public bool ChildSeat { get; set; }
    public string? Notes { get; set; }

    // Optional configuration snapshot for quote
    public int? ConfigurationId { get; set; }
    public string? Color { get; set; }
    public List<int> OptionIds { get; set; } = new();
}

public class BookTestDriveResponseDto
{
    public int OrderId { get; set; }
    public DateTime StartsAtUtc { get; set; }
    public int DurationMinutes { get; set; }
    public PricingQuoteDto? Quote { get; set; }
}

