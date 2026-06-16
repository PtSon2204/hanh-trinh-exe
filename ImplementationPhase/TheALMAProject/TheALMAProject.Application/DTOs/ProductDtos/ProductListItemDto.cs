namespace TheALMAProject.Application.DTOs.ProductDtos
{
    /// <summary>
    /// DTO cho danh sách sản phẩm (UC-08) — chỉ chứa thông tin tóm tắt
    /// </summary>
    public class ProductListItemDto
    {
        public int ProductId { get; set; }

        public int? BaseProductId { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsCustomizable { get; set; }

        // Thông tin từ BaseProduct
        public string? Category { get; set; }

        public string? Material { get; set; }

        // Thông tin từ University
        public string? UniversityName { get; set; }

        // Thông tin đánh giá tổng hợp
        public double AverageRating { get; set; }

        public int ReviewCount { get; set; }
    }
}
