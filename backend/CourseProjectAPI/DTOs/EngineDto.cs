namespace CourseProjectAPI.DTOs
{
    public class EngineDto
    {
        public decimal Capacity { get; set; }
        public string FuelType { get; set; } = null!;
        public int? Power { get; set; } // Мощность в л.с. (опционально, если есть в БД)
    }
}

