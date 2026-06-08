namespace CourseProjectAPI.Models;

public partial class Engine
{
    public int EngineId { get; set; }
    public string EngineName { get; set; } = null!;
    public decimal EngineCapacity { get; set; } // Объем в литрах
    public int Power { get; set; } // Мощность в л.с.
    public string FuelType { get; set; } = null!; // Petrol, Diesel, Electric, Hybrid
    public decimal PriceModifier { get; set; }
    public bool IsAvailable { get; set; }

    public virtual ICollection<ModelEngine> ModelEngines { get; set; } = new List<ModelEngine>();
}

