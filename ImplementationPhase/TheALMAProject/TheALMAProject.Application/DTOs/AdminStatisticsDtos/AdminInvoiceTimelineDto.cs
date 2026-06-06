namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminInvoiceTimelineDto
    {
        public string Period { get; set; } = null!;

        public int InvoiceCount { get; set; }

        public int OrderCount { get; set; }

        public decimal InvoiceRevenue { get; set; }

        public decimal OrderRevenue { get; set; }
    }
}
