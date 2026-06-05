namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminInvoiceStatisticsDto
    {
        public int TotalInvoices { get; set; }

        public int TotalOrders { get; set; }

        public int InvoicedOrderCount { get; set; }

        public int UninvoicedOrderCount { get; set; }

        public decimal TotalInvoiceRevenue { get; set; }

        public decimal TotalOrderRevenue { get; set; }

        public decimal RevenueGap { get; set; }

        public decimal InvoiceCoverageRate { get; set; }

        public List<AdminInvoiceStatusBreakdownDto> InvoiceStatusBreakdown { get; set; } = new();

        public List<AdminInvoicePaymentBreakdownDto> PaymentStatusBreakdown { get; set; } = new();

        public List<AdminInvoiceTimelineDto> Timeline { get; set; } = new();

        public List<AdminInvoiceMismatchDto> Mismatches { get; set; } = new();
    }
}
