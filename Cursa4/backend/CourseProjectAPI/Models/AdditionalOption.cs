using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class AdditionalOption
{
    public int OptionId { get; set; }

    public string OptionName { get; set; } = null!;

    public string? Description { get; set; }

    public decimal OptionPrice { get; set; }

    public string? Category { get; set; }

    public virtual ICollection<OrderOption> OrderOptions { get; set; } = new List<OrderOption>();
}
