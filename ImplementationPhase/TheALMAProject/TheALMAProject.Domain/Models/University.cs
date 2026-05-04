using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class University
{
    public int UniversityId { get; set; }

    public string Name { get; set; } = null!;

    public string? LogoUrl { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<StoreProduct> StoreProducts { get; set; } = new List<StoreProduct>();
}
