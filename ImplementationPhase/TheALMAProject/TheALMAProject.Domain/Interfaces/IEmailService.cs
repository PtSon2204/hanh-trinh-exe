namespace TheALMAProject.Domain.Interfaces
{
    /// <summary>
    /// Interface gửi email. Hiện tại dùng mock (log console).
    /// Sau này thay bằng SendGrid, Mailgun, hoặc SMTP provider thật.
    /// </summary>
    public interface IEmailService
    {
        /// <summary>
        /// Gửi email đến một địa chỉ cụ thể.
        /// </summary>
        /// <param name="toEmail">Email người nhận</param>
        /// <param name="subject">Tiêu đề email</param>
        /// <param name="htmlBody">Nội dung email (HTML)</param>
        Task SendEmailAsync(string toEmail, string subject, string htmlBody);
    }
}
