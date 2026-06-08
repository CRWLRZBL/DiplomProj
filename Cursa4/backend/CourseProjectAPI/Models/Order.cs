using System;
using System.Collections.Generic;

namespace CourseProjectAPI.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public int UserId { get; set; }

    public int CarId { get; set; }

    public int ConfigurationId { get; set; }

    public decimal TotalPrice { get; set; }

    public string OrderStatus { get; set; } = null!;

    public DateTime OrderDate { get; set; }

    public DateOnly? DeliveryDate { get; set; }

    public string? Notes { get; set; }

    public virtual Car Car { get; set; } = null!;

    public virtual Configuration Configuration { get; set; } = null!;

    public virtual ICollection<OrderOption> OrderOptions { get; set; } = new List<OrderOption>();

    public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();

    public virtual User User { get; set; } = null!;
}
