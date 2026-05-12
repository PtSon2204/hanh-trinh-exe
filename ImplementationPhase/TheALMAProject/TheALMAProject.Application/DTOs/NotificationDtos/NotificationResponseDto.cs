namespace TheALMAProject.Application.DTOs.NotificationDtos
{
    /// <summary>
    /// UC-40: DTO trả về thông tin notification
    /// </summary>
    public class NotificationResponseDto
    {
        public int NotificationId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!;
        public bool IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
