namespace TheALMAProject.Application.DTOs.ProductDtos
{
    /// <summary>
    /// DTO cho review sản phẩm, embed trong ProductDetailDto (UC-09)
    /// </summary>
    public class ProductReviewDto
    {
        public int ReviewId { get; set; }

        public string UserName { get; set; } = null!;

        public string? UserAvatar { get; set; }

        public int Rating { get; set; }

        public string? Comment { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
