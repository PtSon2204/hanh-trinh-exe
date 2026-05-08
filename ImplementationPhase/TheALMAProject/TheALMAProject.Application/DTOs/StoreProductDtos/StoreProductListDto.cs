namespace TheALMAProject.Application.DTOs.StoreProductDtos
{
    public class StoreProductListDto
    {
        public int ProductId { get; set; }

        public int? BaseProductId { get; set; }

        public int? UniversityId { get; set; }

        public string Name { get; set; } = null!;

        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        public bool IsCustomizable { get; set; }

        public bool IsActive { get; set; }
    }
}
