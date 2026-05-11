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

        // UC-08: Filter theo kiểu dáng (Category) và chất liệu (Material) từ BaseProduct
        public string? Category { get; set; }

        public string? Material { get; set; }

        // UC-08: Filter khoảng giá
        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }

        // UC-08: Sắp xếp (price, name, newest)
        public string? SortBy { get; set; }

        public bool SortDescending { get; set; } = false;
    }
}
