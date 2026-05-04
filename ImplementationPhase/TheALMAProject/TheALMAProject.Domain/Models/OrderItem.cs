using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class OrderItem
{
    public int OrderItemId { get; set; }

    public int OrderId { get; set; }

    public int? ProductId { get; set; }

    public int? DesignId { get; set; }

    public string Size { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public virtual UserDesign? Design { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual StoreProduct? Product { get; set; }
}
