namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderItemDto
    {
        public int OrderItemId { get; set; }
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string? FrontPreviewImageUrl { get; set; }
        public string? BackPreviewImageUrl { get; set; }
        public string? CanvasJson { get; set; }
        public string? FrontCanvasJson { get; set; }
        public string? BackCanvasJson { get; set; }
        public string? PrintAreaJson { get; set; }
        public string? ProductFrontImageUrl { get; set; }
        public string? ProductBackImageUrl { get; set; }
        public string Size { get; set; } = null!;
        public bool RequiresSize { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
