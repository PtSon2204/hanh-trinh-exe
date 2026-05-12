using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    /// <summary>
    /// UC-40: Query params cho danh sách notifications
    /// </summary>
    public class NotificationQuery : PaginationParams
    {
        public string? Type { get; set; }
        public bool? IsRead { get; set; }
    }
}
