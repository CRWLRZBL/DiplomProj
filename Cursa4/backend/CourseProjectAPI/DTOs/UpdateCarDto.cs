namespace CourseProjectAPI.DTOs
{
    public class UpdateCarDto
    {
        public string? Color { get; set; }
        public string? Status { get; set; }
        public string? Vin { get; set; }
        public int? Mileage { get; set; }
        public string? ImageUrl { get; set; }
        public List<string>? ImageUrls { get; set; }
        public string? Condition { get; set; }
    }
}

