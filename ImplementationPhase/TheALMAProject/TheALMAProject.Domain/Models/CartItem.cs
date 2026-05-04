using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class CartItem
{
    public int CartItemId { get; set; }

    public int CartId { get; set; }

    public int? ProductId { get; set; }

    public int? DesignId { get; set; }

    public string Size { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public virtual Cart Cart { get; set; } = null!;

    public virtual UserDesign? Design { get; set; }

    public virtual StoreProduct? Product { get; set; }
}
