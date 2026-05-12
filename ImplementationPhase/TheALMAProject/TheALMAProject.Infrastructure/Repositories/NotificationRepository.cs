using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    /// <summary>
    /// UC-40: Repository xử lý Notification
    /// </summary>
    public class NotificationRepository : INotificationRepository
    {
        private readonly ApplicationDbContext _context;

        public NotificationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Notification>> GetNotificationsByUserIdAsync(int userId, NotificationQuery query)
        {
            var notifications = _context.Notifications
                .Where(n => n.UserId == userId)
                .AsNoTracking()
                .AsQueryable();

            // Filter theo Type
            if (!string.IsNullOrWhiteSpace(query.Type))
            {
                notifications = notifications.Where(n => n.Type == query.Type);
            }

            // Filter theo IsRead
            if (query.IsRead.HasValue)
            {
                notifications = notifications.Where(n => n.IsRead == query.IsRead.Value);
            }

            // Mới nhất lên đầu
            notifications = notifications.OrderByDescending(n => n.CreatedAt);

            var totalRecords = await notifications.CountAsync();
            var data = await notifications
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<Notification>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<Notification?> GetByIdAsync(int notificationId)
        {
            return await _context.Notifications.FindAsync(notificationId);
        }

        public async Task<int> GetUnreadCountAsync(int userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .CountAsync();
        }

        public async Task AddAsync(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
        }

        public void MarkAsRead(Notification notification)
        {
            notification.IsRead = true;
            _context.Notifications.Update(notification);
        }

        public async Task MarkAllAsReadAsync(int userId)
        {
            await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
        }
    }
}
