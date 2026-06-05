namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminInvoiceStatusBreakdownDto
    {
        public string InvoiceStatus { get; set; } = null!;

        public int InvoiceCount { get; set; }

        public decimal TotalAmount { get; set; }
    }
}
