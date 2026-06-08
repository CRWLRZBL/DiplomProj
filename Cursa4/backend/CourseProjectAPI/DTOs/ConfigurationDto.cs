namespace CourseProjectAPI.DTOs
{
    public class ConfigurationDto
    {
        public int ConfigurationId { get; set; }
        public int ModelId { get; set; }
        public string ConfigurationName { get; set; } = null!;
        public string? Description { get; set; }
        public decimal AdditionalPrice { get; set; }
        
        // Характеристики двигателя
        public int? EnginePower { get; set; } // Мощность в л.с.
        public decimal? EngineCapacity { get; set; } // Объем двигателя
        public string? FuelType { get; set; } // Тип топлива
        
        // Коробка передач
        public string? TransmissionType { get; set; }
    }
}

