using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class IconQuery : PaginationParams
    {
        public string? Name { get; set; }

        public string? Category { get; set; }

        public bool? IsActive { get; set; }
    }
}
