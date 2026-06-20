namespace TheALMAProject.Application.DTOs.ProductDtos
{
    /// <summary>
    /// DTO gọn nhẹ cho UC-10: Search Products (AJAX overlay)
    /// Chỉ trả về thông tin cần thiết để hiện kết quả search nhanh
    /// </summary>
    public class SearchProductDto
    {
        public int ProductId { get; set; }
        public int? BaseProductId { get; set; }
        public string Name { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public decimal Price { get; set; }
        public string? Category { get; set; }
        public string? UniversityName { get; set; }
    }
}
