using System;
using System.Collections.Generic;

namespace TheALMAProject.Infrastructure.Models;

public partial class StoreProduct
{
    public int ProductId { get; set; }

    public int? BaseProductId { get; set; }

    public int? UniversityId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsCustomizable { get; set; }

    public bool IsActive { get; set; }

    public virtual BaseProduct? BaseProduct { get; set; }

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual University? University { get; set; }
}
