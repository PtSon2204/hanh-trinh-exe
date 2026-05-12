namespace TheALMAProject.Domain.Queries
{
    public class AdminFinancialReportQuery
    {
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string? GroupBy { get; set; } = "month";
        public string? CurrencyCode { get; set; }
    }
}
