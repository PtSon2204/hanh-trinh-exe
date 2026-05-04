using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class Icon
{
    public int IconId { get; set; }

    public string Name { get; set; } = null!;

    public string ImageUrl { get; set; } = null!;

    public decimal PriceAddon { get; set; }

    public string Category { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<UserDesign> Designs { get; set; } = new List<UserDesign>();
}
