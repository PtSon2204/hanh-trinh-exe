namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminProductStatisticsDto
    {
        public int TotalItemsSold { get; set; }

        public int TotalOrders { get; set; }

        public int CustomItemCount { get; set; }

        public int ReadyMadeItemCount { get; set; }

        public decimal CustomRevenue { get; set; }

        public decimal ReadyMadeRevenue { get; set; }

        public List<AdminTopProductDto> TopStoreProducts { get; set; } = new();

        public List<AdminTopBaseProductDto> TopBaseProducts { get; set; } = new();

        public List<AdminTopUniversityDto> TopUniversities { get; set; } = new();

        public List<AdminCustomizationTrendDto> CustomizationTrend { get; set; } = new();
    }
}
