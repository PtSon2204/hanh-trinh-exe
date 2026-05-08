using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class BaseProductQuery : PaginationParams
    {
        public string? Name { get; set; }

        public string? Category { get; set; }

        public string? Material { get; set; }

        public bool? IsActive { get; set; }
    }
}
