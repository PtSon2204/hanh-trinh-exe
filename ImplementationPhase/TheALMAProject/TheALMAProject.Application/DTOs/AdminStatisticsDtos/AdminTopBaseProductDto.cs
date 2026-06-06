namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminTopBaseProductDto
    {
        public int? BaseProductId { get; set; }

        public string BaseProductName { get; set; } = null!;

        public string? Category { get; set; }

        public int QuantitySold { get; set; }

        public int OrderCount { get; set; }

        public decimal Revenue { get; set; }
    }
}
