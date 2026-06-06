namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminStatusBreakdownDto
    {
        public string Status { get; set; } = null!;

        public int OrderCount { get; set; }

        public int ItemCount { get; set; }

        public decimal Revenue { get; set; }
    }
}
