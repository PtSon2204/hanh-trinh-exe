namespace TheALMAProject.Domain.Interfaces
{
    /// <summary>
    /// Interface gửi email. Sử dụng SendGrid API (HTTP).
    /// Hoạt động ổn định cả khi chạy local và deploy (không bị chặn port SMTP).
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

        /// <summary>
        /// UC-06: Gửi email xác nhận đơn hàng cho khách
        /// </summary>
        Task SendOrderConfirmationAsync(string toEmail, string customerName, string orderCode, decimal totalAmount);

        /// <summary>
        /// UC-06: Gửi email thông báo cập nhật trạng thái đơn hàng
        /// </summary>
        Task SendOrderStatusUpdateAsync(string toEmail, string customerName, string orderCode, string newStatus);

        /// <summary>
        /// UC-06: Gửi email thông báo đơn hàng mới cho Admin/Order Manager
        /// </summary>
        Task SendNewOrderNotificationAsync(string toEmail, string orderCode, decimal totalAmount);

        /// <summary>
        /// Gửi email thông báo hoàn tiền đơn hàng bị hủy cho khách hàng
        /// </summary>
        Task SendRefundNotificationAsync(string toEmail, string customerName, string orderCode, decimal amount);
    }
}
