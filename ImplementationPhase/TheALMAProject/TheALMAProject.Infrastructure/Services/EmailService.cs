using TheALMAProject.Domain.Interfaces;

namespace TheALMAProject.Infrastructure.Services
{
    /// <summary>
    /// EmailService — Implementation gửi email.
    /// 
    /// HIỆN TẠI: Chỉ log ra Console cho mục đích development/test.
    /// SAU NÀY: Thay bằng SendGrid, Mailgun, hoặc SMTP provider thật.
    /// 
    /// Cách thay thế:
    /// 1. Install package (vd: SendGrid SDK)
    /// 2. Sửa code trong SendEmailAsync để gọi SendGrid API thay vì Console.WriteLine
    /// 3. Thêm API Key vào appsettings.json
    /// Không cần sửa bất kỳ file nào khác nhờ Dependency Inversion (dùng interface IEmailService)
    /// </summary>
    public class EmailService : IEmailService
    {
        /// <summary>
        /// Gửi email (hiện tại chỉ log ra console).
        /// </summary>
        public Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            // ======================================================================
            // 📧 MOCK EMAIL SERVICE — Chỉ dùng cho Development
            // Trong Console sẽ hiện nội dung email để verify logic đúng.
            // ======================================================================
            Console.WriteLine("╔══════════════════════════════════════════════════════╗");
            Console.WriteLine("║               📧 MOCK EMAIL SERVICE                 ║");
            Console.WriteLine("╠══════════════════════════════════════════════════════╣");
            Console.WriteLine($"║ To:      {toEmail}");
            Console.WriteLine($"║ Subject: {subject}");
            Console.WriteLine("╠══════════════════════════════════════════════════════╣");
            Console.WriteLine($"║ Body:    {StripHtml(htmlBody)}");
            Console.WriteLine("╚══════════════════════════════════════════════════════╝");

            return Task.CompletedTask;
        }

        /// <summary>
        /// Loại bỏ HTML tags để log text thuần ra console cho dễ đọc.
        /// </summary>
        private static string StripHtml(string html)
        {
            return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", "").Trim();
        }
    }
}
