namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminCustomizationTrendDto
    {
        public string Period { get; set; } = null!;

        public int CustomItemCount { get; set; }

        public int ReadyMadeItemCount { get; set; }

        public decimal CustomRevenue { get; set; }

        public decimal ReadyMadeRevenue { get; set; }
    }
}
