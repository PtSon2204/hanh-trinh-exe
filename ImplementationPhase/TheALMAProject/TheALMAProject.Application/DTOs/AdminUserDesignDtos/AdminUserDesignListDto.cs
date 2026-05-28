namespace TheALMAProject.Application.DTOs.AdminUserDesignDtos
{
    public class AdminUserDesignListDto
    {
        public int DesignId { get; set; }
        public string? DesignName { get; set; }
        public string? PreviewImageUrl { get; set; }
        public string? FrontPreviewImageUrl { get; set; }
        public string? BackPreviewImageUrl { get; set; }
        public bool IsOrdered { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string BaseProductName { get; set; } = string.Empty;
    }
}
