namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminOperationStatisticsDto
    {
        public int TotalOrders { get; set; }
        public int TotalItems { get; set; }
        public decimal TotalRevenue { get; set; }
        public List<AdminStatusBreakdownDto> OrderStatusBreakdown { get; set; } = new();
        public List<AdminStatusBreakdownDto> PaymentStatusBreakdown { get; set; } = new();
        public List<AdminAgingBucketDto> AgingBuckets { get; set; } = new();
        public List<AdminOperationalExceptionDto> Exceptions { get; set; } = new();
        public int OrdersNeedingProduction { get; set; }
        public int OrdersNeedingShipping { get; set; }
        public int CustomItemsNeedingExport { get; set; }
    }
}
