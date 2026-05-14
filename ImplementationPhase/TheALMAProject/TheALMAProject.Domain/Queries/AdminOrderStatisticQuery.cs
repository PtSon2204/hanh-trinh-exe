namespace TheALMAProject.Domain.Queries
{
    public class AdminOrderStatisticQuery
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? GroupBy { get; set; } = "month";
        public string? OrderStatus { get; set; }
        public string? PaymentStatus { get; set; }
    }
}
