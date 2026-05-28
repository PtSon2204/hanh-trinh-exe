using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route("api/admin/orders")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminOrderController : ControllerBase
    {
        private readonly IAdminOrderService _adminOrderService;

        public AdminOrderController(IAdminOrderService adminOrderService)
        {
            _adminOrderService = adminOrderService;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders([FromQuery] PaginationParams query)
        {
            var result = await _adminOrderService.GetOrders(query);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var result = await _adminOrderService.GetOrderById(id);
            if (result == null)
            {
                return NotFound(new { message = $"Order with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetOrderStatistics([FromQuery] AdminOrderStatisticQuery query)
        {
            var result = await _adminOrderService.GetOrderStatistics(query);
            return Ok(result);
        }

        [HttpPost("{id:int}/print-files")]
        public async Task<IActionResult> ExportPrintFiles(int id)
        {
            var result = await _adminOrderService.ExportPrintFiles(id);
            return Ok(result);
        }

        [HttpPost("{id:int}/fabric-print-files")]
        public async Task<IActionResult> SaveFabricPrintFiles(int id, [FromBody] AdminOrderFabricPrintFileUploadDto dto)
        {
            var result = await _adminOrderService.SaveFabricPrintFiles(id, dto);
            return Ok(result);
        }

        [HttpPut("{id:int}/status")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] AdminUpdateOrderStatusDto dto)
        {
            await _adminOrderService.UpdateOrderStatus(id, dto);

            return Ok(new
            {
                message = $"Update order status for id {id} successfully!"
            });
        }
    }
}
