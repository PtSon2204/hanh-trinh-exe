namespace TheALMAProject.Application.DTOs.ProductDtos
{
    /// <summary>
    /// DTO chi tiết sản phẩm (UC-09) — gallery ảnh, thông số, bảng size, màu, đánh giá
    /// </summary>
    public class ProductDetailDto
    {
        public int ProductId { get; set; }

        public int? BaseProductId { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsCustomizable { get; set; }

        // Thông tin từ BaseProduct — Gallery ảnh
        public string? FrontImageUrl { get; set; }

        public string? BackImageUrl { get; set; }

        // Thông số từ BaseProduct
        public string? Category { get; set; }

        public string? Material { get; set; }

        public decimal? BasePrice { get; set; }

        // Bảng size & màu (chuỗi CSV từ BaseProduct, FE sẽ parse)
        public List<string> AvailableSizes { get; set; } = new();

        public List<string> AvailableColors { get; set; } = new();

        // Thông tin University
        public int? UniversityId { get; set; }

        public string? UniversityName { get; set; }

        public string? UniversityLogoUrl { get; set; }

        // Đánh giá tổng hợp
        public double AverageRating { get; set; }

        public int ReviewCount { get; set; }

        // Danh sách reviews chi tiết
        public List<ProductReviewDto> Reviews { get; set; } = new();
    }
}
