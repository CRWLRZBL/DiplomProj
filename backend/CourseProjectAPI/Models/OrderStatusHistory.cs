using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class OrderStatusHistory
{
    public int HistoryId { get; set; }

    public int OrderId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime ChangedAt { get; set; }

    public int? ChangedBy { get; set; }

    public string? Notes { get; set; }

    public virtual User? ChangedByNavigation { get; set; }

    public virtual Order Order { get; set; } = null!;
}
