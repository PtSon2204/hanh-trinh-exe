using TheALMAProject.Application.DTOs.AdminInvoiceDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminInvoiceService
    {
        Task<PagedResult<AdminInvoiceListDto>> GetInvoices(AdminInvoiceQuery query);
        Task<AdminInvoiceDto?> GetInvoiceById(int id);
        Task<byte[]?> DownloadInvoicePdf(int id);
        Task<byte[]> ExportInvoices(AdminInvoiceQuery query);
        Task<IEnumerable<AdminFinancialReportDto>> GetFinancialReport(AdminFinancialReportQuery query);
        Task<byte[]> ExportFinancialReport(AdminFinancialReportQuery query);
    }
}
