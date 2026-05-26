namespace TheALMAProject.Application.DTOs.AdminOrderDtos
{
    public class AdminOrderFabricPrintFileUploadDto
    {
        public List<AdminOrderFabricPrintFileItemDto> Items { get; set; } = new();
    }

    public class AdminOrderFabricPrintFileItemDto
    {
        public int OrderItemId { get; set; }
        public string ArtworkPngDataUrl { get; set; } = null!;
        public string PlacementGuidePngDataUrl { get; set; } = null!;
    }
}
