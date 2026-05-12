using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Models;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IInvoiceRepository
    {
        Task<Invoice?> GetByOrderIdAsync(int orderId, int userId);
        Task<PagedResult<Invoice>> GetAdminInvoicesAsync(AdminInvoiceQuery queryParams);
        Task<Invoice?> GetAdminInvoiceDetailAsync(int invoiceId);
        Task<List<Invoice>> GetAdminInvoicesForExportAsync(AdminInvoiceQuery queryParams);
        Task<List<Invoice>> GetAdminInvoicesForReportAsync(AdminFinancialReportQuery queryParams);
        Task AddInvoiceAsync(Invoice invoice);
    }
}
