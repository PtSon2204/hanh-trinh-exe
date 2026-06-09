using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class BaseProduct
{
    public int BaseProductId { get; set; }

    public string Name { get; set; } = null!;

    public decimal BasePrice { get; set; }

    public string? FrontImageUrl { get; set; }

    public string? BackImageUrl { get; set; }

    public string? PrintAreaJson { get; set; }

    public string Category { get; set; } = null!;

    public string Material { get; set; } = null!;

    public string? AvailableColors { get; set; }

    public string? AvailableSizes { get; set; }

    public bool IsActive { get; set; }

    public virtual BaseProduct3DConfig? ThreeDConfig { get; set; }

    public virtual ICollection<StoreProduct> StoreProducts { get; set; } = new List<StoreProduct>();

    public virtual ICollection<UserDesign> UserDesigns { get; set; } = new List<UserDesign>();
}
