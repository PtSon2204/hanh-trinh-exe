using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route("api/admin/reports/financial")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminFinancialReportController : ControllerBase
    {
        private readonly IAdminInvoiceService _adminInvoiceService;

        public AdminFinancialReportController(IAdminInvoiceService adminInvoiceService)
        {
            _adminInvoiceService = adminInvoiceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFinancialReport([FromQuery] AdminFinancialReportQuery query)
        {
            var result = await _adminInvoiceService.GetFinancialReport(query);
            return Ok(result);
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportFinancialReport([FromQuery] AdminFinancialReportQuery query)
        {
            var fileBytes = await _adminInvoiceService.ExportFinancialReport(query);
            return File(fileBytes, "text/csv", "admin-financial-report.csv");
        }
    }
}
