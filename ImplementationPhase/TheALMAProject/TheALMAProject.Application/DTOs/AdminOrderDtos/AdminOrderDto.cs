namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public int UserId { get; set; }
        public string UserEmail { get; set; } = null!;
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
        public IEnumerable<AdminOrderItemDto> Items { get; set; } = new List<AdminOrderItemDto>();

        // Thông tin hoàn tiền (nếu có)
        public string? RefundBankName { get; set; }
        public string? RefundAccountNumber { get; set; }
        public string? RefundAccountName { get; set; }
    }
}
