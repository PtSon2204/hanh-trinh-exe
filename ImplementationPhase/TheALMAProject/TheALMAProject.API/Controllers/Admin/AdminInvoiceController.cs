using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route("api/admin/invoices")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminInvoiceController : ControllerBase
    {
        private readonly IAdminInvoiceService _adminInvoiceService;

        public AdminInvoiceController(IAdminInvoiceService adminInvoiceService)
        {
            _adminInvoiceService = adminInvoiceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetInvoices([FromQuery] AdminInvoiceQuery query)
        {
            var result = await _adminInvoiceService.GetInvoices(query);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetInvoiceById(int id)
        {
            var result = await _adminInvoiceService.GetInvoiceById(id);
            if (result == null)
            {
                return NotFound(new { message = $"Invoice with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpGet("{id:int}/download")]
        public async Task<IActionResult> DownloadInvoice(int id)
        {
            var pdfBytes = await _adminInvoiceService.DownloadInvoicePdf(id);
            if (pdfBytes == null)
            {
                return NotFound(new { message = $"Invoice with id {id} not found!" });
            }

            return File(pdfBytes, "application/pdf", $"HoaDon_TheAlma_{id}.pdf");
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportInvoices([FromQuery] AdminInvoiceQuery query)
        {
            var fileBytes = await _adminInvoiceService.ExportInvoices(query);
            return File(fileBytes, "text/csv", "admin-invoices.csv");
        }

    }
}
