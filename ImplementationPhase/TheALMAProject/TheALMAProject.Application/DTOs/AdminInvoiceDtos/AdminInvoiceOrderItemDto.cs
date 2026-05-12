namespace TheALMAProject.Application.DTOs.AdminInvoiceDtos
{
    public class AdminInvoiceOrderItemDto
    {
        public int OrderItemId { get; set; }
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal LineTotal { get; set; }
    }
}
