using TheALMAProject.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MimeKit.Text;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace TheALMAProject.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
        {
            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(
                _config["Smtp:SenderName"] ?? "ALMA Custom Threads", 
                _config["Smtp:SenderEmail"] ?? "noreply@almacustom.vn"));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = htmlBody };

            using var smtp = new SmtpClient();
            try
            {
                var host = _config["Smtp:Host"];
                var port = int.Parse(_config["Smtp:Port"] ?? "587");
                var user = _config["Smtp:Username"];
                var pass = _config["Smtp:Password"];

                // Bỏ qua nếu chưa cấu hình thật, log ra console
                if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass) || user == "your_email@gmail.com")
                {
                    Console.WriteLine("╔══════════════════════════════════════════════════════╗");
                    Console.WriteLine("║        📧 MOCK EMAIL SERVICE (Chưa cấu hình SMTP)   ║");
                    Console.WriteLine("╠══════════════════════════════════════════════════════╣");
                    Console.WriteLine($"║ To:      {toEmail}");
                    Console.WriteLine($"║ Subject: {subject}");
                    Console.WriteLine("╠══════════════════════════════════════════════════════╣");
                    Console.WriteLine($"║ Body:    {StripHtml(htmlBody)}");
                    Console.WriteLine("╚══════════════════════════════════════════════════════╝");
                    return;
                }

                await smtp.ConnectAsync(host, port, SecureSocketOptions.StartTls);
                await smtp.AuthenticateAsync(user, pass);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Email Error]: Lỗi gửi mail đến {toEmail}. Chi tiết: {ex.Message}");
            }
        }

        /// <summary>
        /// UC-06: Gửi email xác nhận đơn hàng cho khách
        /// </summary>
        public Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderCode, decimal totalAmount)
        {
            var subject = $"ALMA - Xác nhận đơn hàng #{orderCode}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                        <h1 style='color: white; margin: 0;'>🎉 Đặt hàng thành công!</h1>
                    </div>
                    <div style='padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;'>
                        <p>Xin chào <strong>{customerName}</strong>,</p>
                        <p>Cảm ơn bạn đã đặt hàng tại <strong>ALMA Custom Threads</strong>!</p>
                        <div style='background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;'>
                            <p style='margin: 5px 0;'>📦 Mã đơn hàng: <strong style='color: #2563eb; font-size: 18px;'>{orderCode}</strong></p>
                            <p style='margin: 5px 0;'>💰 Tổng tiền: <strong style='color: #059669; font-size: 18px;'>{totalAmount:N0} VNĐ</strong></p>
                        </div>
                        <p>Đơn hàng của bạn đang được xử lý. Chúng tôi sẽ thông báo khi có cập nhật mới.</p>
                        <p style='color: #64748b; font-size: 14px; margin-top: 30px;'>— Đội ngũ ALMA Custom Threads</p>
                    </div>
                </div>";

            return SendEmailAsync(toEmail, subject, body);
        }

        /// <summary>
        /// UC-06: Gửi email thông báo cập nhật trạng thái đơn hàng
        /// </summary>
        public Task SendOrderStatusUpdateAsync(string toEmail, string customerName, string orderCode, string newStatus)
        {
            var statusEmoji = newStatus switch
            {
                "Processing" => "⚙️",
                "Shipped" => "🚚",
                "Delivered" => "✅",
                "Cancelled" => "❌",
                _ => "📋"
            };

            var subject = $"ALMA - Cập nhật đơn hàng #{orderCode}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #0891b2, #2563eb); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                        <h1 style='color: white; margin: 0;'>{statusEmoji} Cập nhật đơn hàng</h1>
                    </div>
                    <div style='padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;'>
                        <p>Xin chào <strong>{customerName}</strong>,</p>
                        <p>Đơn hàng <strong style='color: #2563eb;'>#{orderCode}</strong> của bạn đã được cập nhật:</p>
                        <div style='background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0; text-align: center;'>
                            <p style='font-size: 24px; margin: 0;'>{statusEmoji}</p>
                            <p style='font-size: 20px; font-weight: bold; color: #1e293b; margin: 10px 0;'>{newStatus}</p>
                        </div>
                        <p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
                        <p style='color: #64748b; font-size: 14px; margin-top: 30px;'>— Đội ngũ ALMA Custom Threads</p>
                    </div>
                </div>";

            return SendEmailAsync(toEmail, subject, body);
        }

        /// <summary>
        /// UC-06: Gửi email thông báo đơn hàng mới cho Admin/Order Manager
        /// </summary>
        public Task SendNewOrderNotificationAsync(string toEmail, string orderCode, decimal totalAmount)
        {
            var subject = $"ALMA - 🔔 Đơn hàng mới #{orderCode}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #dc2626, #f97316); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                        <h1 style='color: white; margin: 0;'>🔔 Đơn hàng mới!</h1>
                    </div>
                    <div style='padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;'>
                        <p>Có đơn hàng mới cần xử lý:</p>
                        <div style='background: white; padding: 20px; border-radius: 8px; border: 2px solid #f97316; margin: 20px 0;'>
                            <p style='margin: 5px 0;'>📦 Mã đơn: <strong style='color: #dc2626; font-size: 18px;'>{orderCode}</strong></p>
                            <p style='margin: 5px 0;'>💰 Tổng tiền: <strong style='color: #059669; font-size: 18px;'>{totalAmount:N0} VNĐ</strong></p>
                        </div>
                        <p>Vui lòng đăng nhập hệ thống để xử lý đơn hàng.</p>
                        <p style='color: #64748b; font-size: 14px; margin-top: 30px;'>— Hệ thống ALMA</p>
                    </div>
                </div>";

            return SendEmailAsync(toEmail, subject, body);
        }

        /// <summary>
        /// Gửi email thông báo hoàn tiền đơn hàng bị hủy cho khách hàng
        /// </summary>
        public Task SendRefundNotificationAsync(string toEmail, string customerName, string orderCode, decimal amount)
        {
            var subject = $"ALMA - Thông báo hoàn tiền đơn hàng #{orderCode}";
            var body = $@"
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <div style='background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;'>
                        <h1 style='color: white; margin: 0;'>💸 Đã hoàn tiền thành công!</h1>
                    </div>
                    <div style='padding: 30px; background: #f8fafc; border: 1px solid #e2e8f0;'>
                        <p>Xin chào <strong>{customerName}</strong>,</p>
                        <p>Chúng tôi đã thực hiện hoàn tiền thành công cho đơn hàng bị hủy <strong>#{orderCode}</strong> của bạn.</p>
                        <div style='background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;'>
                            <p style='margin: 5px 0;'>📦 Mã đơn hàng: <strong style='color: #2563eb;'>{orderCode}</strong></p>
                            <p style='margin: 5px 0;'>💰 Số tiền hoàn trả: <strong style='color: #10b981; font-size: 18px;'>{amount:N0} VNĐ</strong></p>
                            <p style='margin: 5px 0; color: #64748b; font-size: 14px;'>Phương thức hoàn tiền: Chuyển khoản ngân hàng</p>
                        </div>
                        <p>Vui lòng kiểm tra tài khoản ngân hàng của bạn trong vòng 1-3 ngày làm việc. Nếu có bất kỳ thắc mắc nào, vui lòng phản hồi email này.</p>
                        <p style='color: #64748b; font-size: 14px; margin-top: 30px;'>— Đội ngũ ALMA Custom Threads</p>
                    </div>
                </div>";

            return SendEmailAsync(toEmail, subject, body);
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
