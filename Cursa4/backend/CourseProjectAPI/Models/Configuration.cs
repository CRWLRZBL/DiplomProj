using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class Configuration
{
    public int ConfigurationId { get; set; }

    public int ModelId { get; set; }

    public string ConfigurationName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal AdditionalPrice { get; set; }

    // Характеристики двигателя для данной комплектации
    public int? EnginePower { get; set; } // Мощность в л.с.

    public decimal? EngineCapacity { get; set; } // Объем двигателя (если отличается от базовой модели)

    public string? FuelType { get; set; } // Тип топлива (если отличается от базовой модели)

    // Коробка передач
    public string? TransmissionType { get; set; } // "Механика", "Автомат", "Вариатор", "Робот"

    public virtual Model Model { get; set; } = null!;

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
