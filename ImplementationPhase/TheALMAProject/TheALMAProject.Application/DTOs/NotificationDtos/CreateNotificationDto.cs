namespace TheALMAProject.Application.DTOs.NotificationDtos
{
    /// <summary>
    /// UC-40: DTO tạo notification thủ công (Admin)
    /// </summary>
    public class CreateNotificationDto
    {
        public int UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;
        public string Type { get; set; } = null!;
    }
}
