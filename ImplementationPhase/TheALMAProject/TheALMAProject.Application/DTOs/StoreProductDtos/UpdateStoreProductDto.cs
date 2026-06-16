namespace TheALMAProject.Application.DTOs.StoreProductDtos
{
    public class UpdateStoreProductDto
    {
        public int? BaseProductId { get; set; }
        public int? UniversityId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; } = null!;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public bool IsCustomizable { get; set; } = false;
    }
}
