using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class OrderOption
{
    public int OrderOptionId { get; set; }

    public int OrderId { get; set; }

    public int OptionId { get; set; }

    public int Quantity { get; set; }

    public decimal PriceAtOrder { get; set; }

    public virtual AdditionalOption Option { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;
}
