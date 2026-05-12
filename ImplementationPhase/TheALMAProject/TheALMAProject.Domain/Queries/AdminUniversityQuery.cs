using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class AdminUniversityQuery : PaginationParams
    {
        public string? Name { get; set; }

        public bool? IsActive { get; set; }
    }
}
