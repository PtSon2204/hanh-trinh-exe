using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class AdminInvoiceQuery : PaginationParams
    {
        public int? OrderId { get; set; }
        public int? UserId { get; set; }
        public string? InvoiceNumber { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public string? CurrencyCode { get; set; }
    }
}
