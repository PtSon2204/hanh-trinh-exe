namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderPrintFileDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public int OrderItemId { get; set; }
        public int DesignId { get; set; }
        public string? DesignName { get; set; }
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
        public string PrintFileUrl { get; set; } = null!;
        public string PlacementGuideUrl { get; set; } = null!;
    }
}
