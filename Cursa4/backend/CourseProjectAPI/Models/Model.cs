using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class Model
{
    public int ModelId { get; set; }

    public int BrandId { get; set; }

    public string ModelName { get; set; } = null!;

    public int ModelYear { get; set; }

    public string BodyType { get; set; } = null!;

    public decimal BasePrice { get; set; }

    public string? Description { get; set; }

    public decimal? EngineCapacity { get; set; }

    public string? FuelType { get; set; }

    public bool IsActive { get; set; }

    public string? ImageUrl { get; set; }

    public virtual Brand Brand { get; set; } = null!;

    public virtual ICollection<Car> Cars { get; set; } = new List<Car>();

    public virtual ICollection<Configuration> Configurations { get; set; } = new List<Configuration>();

    public virtual ICollection<ModelColor> ModelColors { get; set; } = new List<ModelColor>();

    public virtual ICollection<ModelEngine> ModelEngines { get; set; } = new List<ModelEngine>();

    public virtual ICollection<ModelTransmission> ModelTransmissions { get; set; } = new List<ModelTransmission>();
}
