namespace CourseProjectAPI.DTOs
{
    public class TransmissionDto
    {
        public string Type { get; set; } = null!; // "Механика", "Автомат", "Вариатор"
        public string? Description { get; set; }
    }
}

