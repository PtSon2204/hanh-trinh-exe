using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Contracts;
using TheALMAProject.Application.DTOs.AdminVoucherDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route(AdminVoucherContract.AdminVoucherRoutePrefix)]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminVoucherController : ControllerBase
    {
        private readonly IAdminVoucherService _adminVoucherService;

        public AdminVoucherController(IAdminVoucherService adminVoucherService)
        {
            _adminVoucherService = adminVoucherService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetVoucherById(int id)
        {
            var result = await _adminVoucherService.GetVoucherById(id);

            if (result == null)
            {
                return NotFound(new { message = $"Voucher with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] AdminVoucherQuery query)
        {
            var result = await _adminVoucherService.GetVouchers(query);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] AdminCreateVoucherDto dto)
        {
            await _adminVoucherService.CreateVoucher(dto);

            return Ok(new
            {
                message = $"Create voucher {dto.Code} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] AdminUpdateVoucherDto dto)
        {
            await _adminVoucherService.UpdateVoucher(id, dto);

            return Ok(new
            {
                message = $"Update voucher {dto.Code} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _adminVoucherService.DeleteVoucher(id);

            return Ok(new
            {
                message = $"Delete voucher with id {id} successfully!"
            });
        }
    }
}
