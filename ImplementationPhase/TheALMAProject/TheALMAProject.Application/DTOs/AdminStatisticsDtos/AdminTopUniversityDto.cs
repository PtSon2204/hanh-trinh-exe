namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminTopUniversityDto
    {
        public int? UniversityId { get; set; }

        public string UniversityName { get; set; } = null!;

        public int QuantitySold { get; set; }

        public int OrderCount { get; set; }

        public decimal Revenue { get; set; }
    }
}
