namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminTopProductDto
    {
        public int? ProductId { get; set; }

        public string ProductName { get; set; } = null!;

        public string? UniversityName { get; set; }

        public int QuantitySold { get; set; }

        public int OrderCount { get; set; }

        public decimal Revenue { get; set; }

        public int CustomItemCount { get; set; }
    }
}
