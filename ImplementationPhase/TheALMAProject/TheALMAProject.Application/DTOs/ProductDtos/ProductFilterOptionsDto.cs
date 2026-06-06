namespace TheALMAProject.Application.DTOs.ProductDtos
{
    public class ProductFilterOptionsDto
    {
        public List<string> Categories { get; set; } = new();

        public List<string> Materials { get; set; } = new();

        public List<ProductFilterUniversityOptionDto> Universities { get; set; } = new();

        public decimal? MinPrice { get; set; }

        public decimal? MaxPrice { get; set; }
    }

    public class ProductFilterUniversityOptionDto
    {
        public int UniversityId { get; set; }

        public string Name { get; set; } = null!;
    }
}
