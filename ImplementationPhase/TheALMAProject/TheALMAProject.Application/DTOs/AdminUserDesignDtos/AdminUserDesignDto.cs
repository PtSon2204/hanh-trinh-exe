namespace TheALMAProject.Application.DTOs.AdminUserDesignDtos
{
    public class AdminUserDesignDto
    {
        public int DesignId { get; set; }
        public int UserId { get; set; }
        public int BaseProductId { get; set; }
        public string CanvasJson { get; set; } = string.Empty;
        public string? PreviewImageUrl { get; set; }
        public string? PrintFileUrl { get; set; }
        public string? DesignName { get; set; }
        public bool IsOrdered { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public string BaseProductName { get; set; } = string.Empty;
    }
}
