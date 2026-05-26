namespace TheALMAProject.Application.DTOs.BaseProductDtos
{
    public class BaseProductListDto
    {
        public int BaseProductId { get; set; }

        public string Name { get; set; } = null!;

        public decimal BasePrice { get; set; }

        public string? FrontImageUrl { get; set; }

        public string? BackImageUrl { get; set; }

        public string? PrintAreaJson { get; set; }

        public string Category { get; set; } = null!;

        public string Material { get; set; } = null!;

        public string? AvailableColors { get; set; }

        public string? AvailableSizes { get; set; }

        public bool IsActive { get; set; }
    }
}
