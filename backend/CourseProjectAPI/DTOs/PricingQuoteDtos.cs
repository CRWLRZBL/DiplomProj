namespace CourseProjectAPI.DTOs;

public class PricingQuoteRequestDto
{
    public int? CarId { get; set; }
    public int? ModelId { get; set; }
    public int ConfigurationId { get; set; }
    public string? Color { get; set; }
    public List<int> OptionIds { get; set; } = new();
}

public class PricingQuoteDto
{
    public decimal BasePrice { get; set; }
    public decimal ConfigurationPrice { get; set; }
    public decimal OptionsPrice { get; set; }
    public decimal ColorPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public List<PricingQuoteLineDto> Lines { get; set; } = new();
}

public class PricingQuoteLineDto
{
    public string Code { get; set; } = string.Empty; // base | configuration | color | option
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

