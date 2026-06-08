namespace CourseProjectAPI.Models;

public partial class Color
{
    public int ColorId { get; set; }
    public string ColorName { get; set; } = null!;
    public string ColorCode { get; set; } = null!; // HEX код цвета
    public decimal PriceModifier { get; set; }
    public bool IsAvailable { get; set; }
    public string? ImageUrl { get; set; }

    public virtual ICollection<ModelColor> ModelColors { get; set; } = new List<ModelColor>();
}

