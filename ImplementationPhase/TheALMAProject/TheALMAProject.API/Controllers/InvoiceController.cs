using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.API.Controllers
{
    [Route("api/order/{orderId}/[controller]")] 
    [ApiController]
    [Authorize]
    public class InvoiceController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;

        public InvoiceController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetInvoiceDetails(int orderId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var result = await _invoiceService.GetInvoiceDataAsync(currentUserId, orderId);

            if (result == null) return NotFound("Không tìm thấy hoá đơn.");

            return Ok(result);
        }

        [HttpGet("download")]
        public async Task<IActionResult> DownloadInvoice(int orderId)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var pdfBytes = await _invoiceService.DownloadInvoicePdfAsync(currentUserId, orderId);

            if (pdfBytes == null) return NotFound("Không tìm thấy hoá đơn.");

            return File(pdfBytes, "application/pdf", $"HoaDon_TheAlma_{orderId}.pdf");
        }
    }
}
