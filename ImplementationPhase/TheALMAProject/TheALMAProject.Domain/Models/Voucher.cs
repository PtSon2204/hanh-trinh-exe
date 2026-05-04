using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class Voucher
{
    public int VoucherId { get; set; }

    public string Code { get; set; } = null!;

    public decimal DiscountPercent { get; set; }

    public decimal MaxDiscount { get; set; }

    public decimal MinOrderAmount { get; set; }

    public int UsageLimit { get; set; }

    public int UsedCount { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
