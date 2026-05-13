namespace TheALMAProject.Application.DTOs.AdminInvoiceDtos
{
    public class AdminInvoiceListDto
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
        public string? OrderCode { get; set; }
        public int UserId { get; set; }
        public string? UserEmail { get; set; }
        public string InvoiceNumber { get; set; } = null!;
        public DateTime IssueDate { get; set; }
        public string BillingName { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public string InvoiceStatus { get; set; } = null!;
        public string? PdfUrl { get; set; }
    }
}
