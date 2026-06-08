namespace CourseProjectAPI.Models;

public partial class Transmission
{
    public int TransmissionId { get; set; }
    public string TransmissionName { get; set; } = null!;
    public string TransmissionType { get; set; } = null!; // Manual, Automatic, CVT, Robot
    public int Gears { get; set; } // Количество передач
    public decimal PriceModifier { get; set; }
    public bool IsAvailable { get; set; }

    public virtual ICollection<ModelTransmission> ModelTransmissions { get; set; } = new List<ModelTransmission>();
}

