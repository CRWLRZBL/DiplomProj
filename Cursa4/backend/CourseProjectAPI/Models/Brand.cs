using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class Brand
{
    public int BrandId { get; set; }

    public string BrandName { get; set; } = null!;

    public string? Description { get; set; }

    public string? Country { get; set; }

    public string? LogoUrl { get; set; }

    public virtual ICollection<Model> Models { get; set; } = new List<Model>();
}
