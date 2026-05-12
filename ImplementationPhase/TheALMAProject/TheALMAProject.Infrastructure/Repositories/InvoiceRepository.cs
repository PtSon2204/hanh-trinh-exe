using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Models;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class InvoiceRepository : IInvoiceRepository
    {
        private readonly ApplicationDbContext _context;

        public InvoiceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Invoice?> GetByOrderIdAsync(int orderId, int userId)
        {
            // Join qua bảng Order để verify đúng người mua
            return await _context.Invoices
                .Include(i => i.Order)
                .FirstOrDefaultAsync(i => i.OrderId == orderId && i.Order.UserId == userId);
        }

        public async Task<PagedResult<Invoice>> GetAdminInvoicesAsync(AdminInvoiceQuery queryParams)
        {
            var query = ApplyAdminInvoiceFilter(_context.Invoices
                .Include(i => i.Order)
                    .ThenInclude(o => o.User)
                .AsNoTracking(), queryParams);

            var totalRecords = await query.CountAsync();

            var items = await query
                .OrderByDescending(i => i.IssueDate)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return new PagedResult<Invoice>
            {
                Data = items,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)queryParams.PageSize)
            };
        }

        public async Task<Invoice?> GetAdminInvoiceDetailAsync(int invoiceId)
        {
            return await _context.Invoices
                .Include(i => i.Order)
                    .ThenInclude(o => o.User)
                .Include(i => i.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.Product)
                .Include(i => i.Order)
                    .ThenInclude(o => o.OrderItems)
                        .ThenInclude(oi => oi.Design)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
        }

        public async Task<List<Invoice>> GetAdminInvoicesForExportAsync(AdminInvoiceQuery queryParams)
        {
            return await ApplyAdminInvoiceFilter(_context.Invoices
                    .Include(i => i.Order)
                        .ThenInclude(o => o.User)
                    .AsNoTracking(), queryParams)
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();
        }

        public async Task<List<Invoice>> GetAdminInvoicesForReportAsync(AdminFinancialReportQuery queryParams)
        {
            var query = _context.Invoices.AsNoTracking().AsQueryable();

            if (queryParams.FromDate.HasValue)
            {
                query = query.Where(i => i.IssueDate >= queryParams.FromDate.Value);
            }

            if (queryParams.ToDate.HasValue)
            {
                var toDateEnd = queryParams.ToDate.Value.AddDays(1).AddTicks(-1);
                query = query.Where(i => i.IssueDate <= toDateEnd);
            }

            if (!string.IsNullOrWhiteSpace(queryParams.CurrencyCode))
            {
                query = query.Where(i => i.CurrencyCode == queryParams.CurrencyCode.Trim());
            }

            return await query.ToListAsync();
        }

        public async Task AddInvoiceAsync(Invoice invoice)
        {
            await _context.Invoices.AddAsync(invoice);
        }

        private static IQueryable<Invoice> ApplyAdminInvoiceFilter(IQueryable<Invoice> query, AdminInvoiceQuery queryParams)
        {
            if (queryParams.OrderId.HasValue)
            {
                query = query.Where(i => i.OrderId == queryParams.OrderId.Value);
            }

            if (queryParams.UserId.HasValue)
            {
                query = query.Where(i => i.Order.UserId == queryParams.UserId.Value);
            }

            if (!string.IsNullOrWhiteSpace(queryParams.InvoiceNumber))
            {
                query = query.Where(i => i.InvoiceNumber.Contains(queryParams.InvoiceNumber.Trim()));
            }

            if (!string.IsNullOrWhiteSpace(queryParams.Status))
            {
                query = query.Where(i => i.InvoiceStatus == queryParams.Status.Trim());
            }

            if (queryParams.FromDate.HasValue)
            {
                query = query.Where(i => i.IssueDate >= queryParams.FromDate.Value);
            }

            if (queryParams.ToDate.HasValue)
            {
                var toDateEnd = queryParams.ToDate.Value.AddDays(1).AddTicks(-1);
                query = query.Where(i => i.IssueDate <= toDateEnd);
            }

            if (queryParams.MinAmount.HasValue)
            {
                query = query.Where(i => i.TotalAmount >= queryParams.MinAmount.Value);
            }

            if (queryParams.MaxAmount.HasValue)
            {
                query = query.Where(i => i.TotalAmount <= queryParams.MaxAmount.Value);
            }

            if (!string.IsNullOrWhiteSpace(queryParams.CurrencyCode))
            {
                query = query.Where(i => i.CurrencyCode == queryParams.CurrencyCode.Trim());
            }

            return query;
        }
    }
}
