namespace TheALMAProject.Application.DTOs.AdminInvoiceDtos
{
    public class AdminInvoiceDto
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
        public string? OrderCode { get; set; }
        public int UserId { get; set; }
        public string? UserEmail { get; set; }
        public string? UserFullName { get; set; }
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
        public DateTime CreatedAt { get; set; }
        public string? PaymentMethod { get; set; }
        public string? PaymentStatus { get; set; }
        public string? OrderStatus { get; set; }
        public IEnumerable<AdminInvoiceOrderItemDto> Items { get; set; } = new List<AdminInvoiceOrderItemDto>();
    }
}
