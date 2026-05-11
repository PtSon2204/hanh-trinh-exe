using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class AdminUserQuery : PaginationParams
    {
        public string? Email { get; set; }

        public string? FullName { get; set; }

        public string? Phone { get; set; }

        public string? Role { get; set; }

        public bool? IsActive { get; set; }
    }
}
