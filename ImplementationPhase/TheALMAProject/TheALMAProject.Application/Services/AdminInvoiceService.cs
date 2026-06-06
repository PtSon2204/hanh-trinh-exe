using System.Globalization;
using System.Text;
using AutoMapper;
using TheALMAProject.Application.DTOs.AdminInvoiceDtos;
using TheALMAProject.Application.DTOs.InvoiceDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Services
{
    public class AdminInvoiceService : IAdminInvoiceService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IPdfService _pdfService;

        public AdminInvoiceService(IUnitOfWork unitOfWork, IMapper mapper, IPdfService pdfService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _pdfService = pdfService;
        }

        public async Task<PagedResult<AdminInvoiceListDto>> GetInvoices(AdminInvoiceQuery query)
        {
            var result = await _unitOfWork.InvoiceRepo.GetAdminInvoicesAsync(query);

            return new PagedResult<AdminInvoiceListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminInvoiceListDto>>(result.Data)
            };
        }

        public async Task<AdminInvoiceDto?> GetInvoiceById(int id)
        {
            var invoice = await _unitOfWork.InvoiceRepo.GetAdminInvoiceDetailAsync(id);
            return invoice == null ? null : _mapper.Map<AdminInvoiceDto>(invoice);
        }

        public async Task<byte[]?> DownloadInvoicePdf(int id)
        {
            var invoice = await _unitOfWork.InvoiceRepo.GetAdminInvoiceDetailAsync(id);
            if (invoice == null)
            {
                return null;
            }

            var invoiceData = _mapper.Map<InvoiceResponseDto>(invoice);
            return _pdfService.GenerateInvoicePdf(invoiceData);
        }

        public async Task<byte[]> ExportInvoices(AdminInvoiceQuery query)
        {
            var invoices = await _unitOfWork.InvoiceRepo.GetAdminInvoicesForExportAsync(query);
            var rows = _mapper.Map<IEnumerable<AdminInvoiceListDto>>(invoices);

            var builder = new StringBuilder();
            builder.AppendLine("InvoiceId,InvoiceNumber,OrderId,OrderCode,UserId,UserEmail,IssueDate,BillingName,CurrencyCode,TotalAmount,InvoiceStatus");

            foreach (var row in rows)
            {
                builder.AppendLine(string.Join(',',
                    row.InvoiceId,
                    EscapeCsv(row.InvoiceNumber),
                    row.OrderId,
                    EscapeCsv(row.OrderCode),
                    row.UserId,
                    EscapeCsv(row.UserEmail),
                    row.IssueDate.ToString("O", CultureInfo.InvariantCulture),
                    EscapeCsv(row.BillingName),
                    EscapeCsv(row.CurrencyCode),
                    row.TotalAmount.ToString(CultureInfo.InvariantCulture),
                    EscapeCsv(row.InvoiceStatus)));
            }

            return Encoding.UTF8.GetBytes(builder.ToString());
        }

        public async Task<IEnumerable<AdminFinancialReportDto>> GetFinancialReport(AdminFinancialReportQuery query)
        {
            var invoices = await _unitOfWork.InvoiceRepo.GetAdminInvoicesForReportAsync(query);
            var groupBy = NormalizeGroupBy(query.GroupBy);

            return invoices
                .GroupBy(invoice => new
                {
                    Period = FormatPeriod(invoice.IssueDate, groupBy),
                    invoice.CurrencyCode
                })
                .OrderBy(group => group.Key.Period)
                .ThenBy(group => group.Key.CurrencyCode)
                .Select(group => new AdminFinancialReportDto
                {
                    Period = group.Key.Period,
                    CurrencyCode = group.Key.CurrencyCode,
                    InvoiceCount = group.Count(),
                    TotalRevenue = group.Sum(invoice => invoice.TotalAmount),
                    TotalShippingFee = group.Sum(invoice => invoice.ShippingFee),
                    TotalDiscount = group.Sum(invoice => invoice.VoucherDiscountAmount),
                    TotalSubTotal = group.Sum(invoice => invoice.SubTotal)
                })
                .ToList();
        }

        public async Task<byte[]> ExportFinancialReport(AdminFinancialReportQuery query)
        {
            var rows = await GetFinancialReport(query);
            var builder = new StringBuilder();
            builder.AppendLine("Period,CurrencyCode,InvoiceCount,TotalRevenue,TotalShippingFee,TotalDiscount,TotalSubTotal");

            foreach (var row in rows)
            {
                builder.AppendLine(string.Join(',',
                    EscapeCsv(row.Period),
                    EscapeCsv(row.CurrencyCode),
                    row.InvoiceCount,
                    row.TotalRevenue.ToString(CultureInfo.InvariantCulture),
                    row.TotalShippingFee.ToString(CultureInfo.InvariantCulture),
                    row.TotalDiscount.ToString(CultureInfo.InvariantCulture),
                    row.TotalSubTotal.ToString(CultureInfo.InvariantCulture)));
            }

            return Encoding.UTF8.GetBytes(builder.ToString());
        }

        private static string NormalizeGroupBy(string? groupBy)
        {
            if (string.Equals(groupBy, "day", StringComparison.OrdinalIgnoreCase))
            {
                return "day";
            }

            if (string.Equals(groupBy, "week", StringComparison.OrdinalIgnoreCase))
            {
                return "week";
            }

            return string.Equals(groupBy, "year", StringComparison.OrdinalIgnoreCase) ? "year" : "month";
        }

        private static string FormatPeriod(DateTime issueDate, string groupBy)
        {
            return groupBy switch
            {
                "day" => issueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
                "week" => $"{issueDate.Year}-W{ISOWeek.GetWeekOfYear(issueDate):00}",
                "year" => issueDate.ToString("yyyy", CultureInfo.InvariantCulture),
                _ => issueDate.ToString("yyyy-MM", CultureInfo.InvariantCulture)
            };
        }

        private static string EscapeCsv(string? value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return string.Empty;
            }

            var safeValue = IsCsvFormulaValue(value) ? $"'{value}" : value;

            return safeValue.Contains(',') || safeValue.Contains('"') || safeValue.Contains('\n') || safeValue.Contains('\r')
                ? $"\"{safeValue.Replace("\"", "\"\"")}\""
                : safeValue;
        }

        private static bool IsCsvFormulaValue(string value)
        {
            var firstContentIndex = 0;
            while (firstContentIndex < value.Length && char.IsWhiteSpace(value[firstContentIndex]))
            {
                firstContentIndex++;
            }

            if (firstContentIndex >= value.Length)
            {
                return false;
            }

            return value[firstContentIndex] is '=' or '+' or '-' or '@';
        }
    }
}
