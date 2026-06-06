namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminInvoicePaymentBreakdownDto
    {
        public string PaymentStatus { get; set; } = null!;

        public int InvoiceCount { get; set; }

        public decimal TotalAmount { get; set; }
    }
}
