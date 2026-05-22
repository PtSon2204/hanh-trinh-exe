namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminCreateOrderDto
    {
        public int UserId { get; set; }
        public string ShipName { get; set; } = null!;
        public string ShipPhone { get; set; } = null!;
        public string ShipAddress { get; set; } = null!;
        public string ShipProvince { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string OrderStatus { get; set; } = null!;
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }
        public int? VoucherId { get; set; }
        public IEnumerable<AdminCreateOrderItemDto> Items { get; set; } = new List<AdminCreateOrderItemDto>();
    }

    public class AdminCreateOrderItemDto
    {
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
