namespace CourseProjectAPI.Models;

public partial class ModelColor
{
    public int ModelId { get; set; }
    public int ColorId { get; set; }
    public string? ImageUrl { get; set; } // Специфичное изображение для модели+цвета

    public virtual Model Model { get; set; } = null!;
    public virtual Color Color { get; set; } = null!;
}

