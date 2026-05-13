namespace TheALMAProject.Application.DTOs.AdminInvoiceDtos
{
    public class AdminFinancialReportDto
    {
        public string Period { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public int InvoiceCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalShippingFee { get; set; }
        public decimal TotalDiscount { get; set; }
        public decimal TotalSubTotal { get; set; }
    }
}
