namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderStatisticDto
    {
        public string Period { get; set; } = null!;
        public int OrderCount { get; set; }
        public int ItemCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalShippingFee { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal TotalSubTotal { get; set; }
    }
}
