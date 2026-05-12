namespace TheALMAProject.Application.DTOs.InvoiceDtos
{
    public class InvoiceResponseDto
    {
        public string InvoiceNumber { get; set; } = null!;
        public DateTime IssueDate { get; set; }
        public string BillingName { get; set; } = null!;
        public string BillingAddress { get; set; } = null!;
        public string? BuyerPhone { get; set; }
        public string? BuyerEmail { get; set; }
        public string CurrencyCode { get; set; } = null!;

        public decimal SubTotal { get; set; }
        public decimal VoucherDiscountAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal TotalAmount { get; set; }
        public string InvoiceStatus { get; set; } = null!;
        public string? PdfUrl { get; set; }
    }
}
