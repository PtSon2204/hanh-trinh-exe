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
        /// Loại bỏ HTML tags để log text thuần ra console cho dễ đọc.
        /// </summary>
        private static string StripHtml(string html)
        {
            return System.Text.RegularExpressions.Regex.Replace(html, "<.*?>", "").Trim();
        }
    }
}
