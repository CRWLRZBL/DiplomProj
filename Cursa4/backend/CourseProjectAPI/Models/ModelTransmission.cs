namespace CourseProjectAPI.Models;

public partial class ModelTransmission
{
    public int ModelId { get; set; }
    public int TransmissionId { get; set; }

    public virtual Model Model { get; set; } = null!;
    public virtual Transmission Transmission { get; set; } = null!;
}

