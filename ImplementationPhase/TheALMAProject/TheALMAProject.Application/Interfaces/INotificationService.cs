using TheALMAProject.Application.DTOs.NotificationDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    /// <summary>
    /// UC-40: Service xử lý Notifications
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// Lấy danh sách notifications của user hiện tại (phân trang)
        /// </summary>
        Task<PagedResult<NotificationResponseDto>> GetMyNotificationsAsync(int userId, NotificationQuery query);

        /// <summary>
        /// Lấy số notifications chưa đọc (cho bell icon)
        /// </summary>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>
        /// Đánh dấu 1 notification đã đọc
        /// </summary>
        Task MarkAsReadAsync(int userId, int notificationId);

        /// <summary>
        /// Đánh dấu tất cả notifications đã đọc
        /// </summary>
        Task MarkAllAsReadAsync(int userId);

        /// <summary>
        /// Admin tạo notification thủ công cho user
        /// </summary>
        Task CreateNotificationAsync(CreateNotificationDto dto);

        /// <summary>
        /// Tự động tạo notification khi có đơn hàng mới
        /// Gửi notification cho Admin + email xác nhận cho khách
        /// </summary>
        Task NotifyNewOrderAsync(int orderId);
    }
}
