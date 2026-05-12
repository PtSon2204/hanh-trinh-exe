namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderListDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public string UserEmail { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string OrderStatus { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
    }
}
