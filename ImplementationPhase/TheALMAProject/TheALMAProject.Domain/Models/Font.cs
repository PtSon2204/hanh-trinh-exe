using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class Font
{
    public int FontId { get; set; }

    public string FontName { get; set; } = null!;

    public string FontFileUrl { get; set; } = null!;

    public decimal PriceAddon { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<UserDesign> Designs { get; set; } = new List<UserDesign>();
}
