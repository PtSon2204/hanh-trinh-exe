using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    /// <summary>
    /// UC-40: Repository cho Notification
    /// </summary>
    public interface INotificationRepository
    {
        Task<PagedResult<Notification>> GetNotificationsByUserIdAsync(int userId, NotificationQuery query);
        Task<Notification?> GetByIdAsync(int notificationId);
        Task<int> GetUnreadCountAsync(int userId);
        Task AddAsync(Notification notification);
        void MarkAsRead(Notification notification);
        Task MarkAllAsReadAsync(int userId);
    }
}
