using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class StoreProductQuery : PaginationParams
    {
        public string? Name { get; set; }

        public int? BaseProductId { get; set; }

        public int? UniversityId { get; set; }

        public bool? IsActive { get; set; }

        public bool? IsCustomizable { get; set; }
    }
}
