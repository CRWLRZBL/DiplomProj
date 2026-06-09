namespace CourseProjectAPI.DTOs;

public class CreateInventoryCarDto
{
    public int ModelId { get; set; }
    public string Color { get; set; } = null!;
    public string Vin { get; set; } = null!;
    public string Status { get; set; } = "Available";
    public int Mileage { get; set; }
}
