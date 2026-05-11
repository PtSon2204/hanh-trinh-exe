using System;
using System.Collections.Generic;
using TheALMAProject.Domain.Models;

namespace TheALMAProject.Infrastructure.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public int UserId { get; set; }

    public string OrderCode { get; set; } = null!;

    public decimal TotalAmount { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal DiscountAmount { get; set; }

    public int? VoucherId { get; set; }

    public string ShipName { get; set; } = null!;

    public string ShipPhone { get; set; } = null!;

    public string ShipAddress { get; set; } = null!;

    public string ShipProvince { get; set; } = null!;

    public string PaymentMethod { get; set; } = null!;

    public string PaymentStatus { get; set; } = null!;

    public string OrderStatus { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual User User { get; set; } = null!;

    public virtual Voucher? Voucher { get; set; }
    public virtual Invoice? Invoice { get; set; }
}
