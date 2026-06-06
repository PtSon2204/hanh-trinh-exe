namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminInvoiceMismatchDto
    {
        public int OrderId { get; set; }

        public string? OrderCode { get; set; }

        public int? InvoiceId { get; set; }

        public string? InvoiceNumber { get; set; }

        public decimal OrderTotal { get; set; }

        public decimal? InvoiceTotal { get; set; }

        public decimal Difference { get; set; }

        public string Reason { get; set; } = null!;
    }
}
