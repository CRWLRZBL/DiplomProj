namespace CourseProjectAPI.Models;

public partial class ModelEngine
{
    public int ModelId { get; set; }
    public int EngineId { get; set; }

    public virtual Model Model { get; set; } = null!;
    public virtual Engine Engine { get; set; } = null!;
}

