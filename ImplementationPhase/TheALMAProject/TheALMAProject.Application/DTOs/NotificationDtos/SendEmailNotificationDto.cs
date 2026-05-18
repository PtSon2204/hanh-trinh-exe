using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace TheALMAProject.Application.DTOs.NotificationDtos
{
    public class SendEmailNotificationDto
    {
        [Required(ErrorMessage = "Tiêu đề không được để trống.")]
        [StringLength(200, ErrorMessage = "Tiêu đề không được vượt quá 200 ký tự.")]
        public string Subject { get; set; } = null!;

        [Required(ErrorMessage = "Nội dung không được để trống.")]
        public string Body { get; set; } = null!;

        /// <summary>
        /// Danh sách email nhận thông báo.
        /// Nếu null hoặc rỗng, hệ thống sẽ gửi cho tất cả user.
        /// </summary>
        public List<string>? Emails { get; set; }
    }
}
