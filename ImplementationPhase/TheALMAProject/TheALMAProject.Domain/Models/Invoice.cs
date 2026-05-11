using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Models
{
    public partial class Invoice
    {
        public int InvoiceId { get; set; }
        public int OrderId { get; set; }
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

        public virtual Order Order { get; set; } = null!;
    }
}
