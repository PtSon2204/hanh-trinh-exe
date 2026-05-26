namespace TheALMAProject.Application.DTOs.UserDesignDtos
{
    public class UserDesignResponseDto
    {
        public int DesignId { get; set; }
        public int BaseProductId { get; set; }
        public string? DesignName { get; set; }
        public string? CanvasJson { get; set; }
        public string? FrontCanvasJson { get; set; }
        public string? BackCanvasJson { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string? FrontPreviewImageUrl { get; set; }
        public string? BackPreviewImageUrl { get; set; }
        public string? PrintFileUrl { get; set; }
        public string? PlacementGuideUrl { get; set; }
        public bool IsOrdered { get; set; }
        public DateTime? CreatedAt { get; set; }

        public decimal TotalEstimatedPrice { get; set; }
    }
}
