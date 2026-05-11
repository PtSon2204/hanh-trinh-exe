using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Contracts;
using TheALMAProject.Application.DTOs.AdminUserDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route(AdminUserContract.AdminUserRoutePrefix)]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUserController : ControllerBase
    {
        private readonly IAdminUserService _adminUserService;

        public AdminUserController(IAdminUserService adminUserService)
        {
            _adminUserService = adminUserService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var result = await _adminUserService.GetUserById(id);

            if (result == null)
            {
                return NotFound(new { message = $"User with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] AdminUserQuery query)
        {
            var result = await _adminUserService.GetUsers(query);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] AdminCreateUserDto dto)
        {
            await _adminUserService.CreateUser(dto);

            return Ok(new
            {
                message = $"Create {dto.Email} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] AdminUpdateUserDto dto)
        {
            await _adminUserService.UpdateUser(id, dto, GetCurrentUserId());

            return Ok(new
            {
                message = $"Update {dto.Email} successfully!"
            });
        }

        [HttpPut("{id:int}/assign-role")]
        public async Task<IActionResult> AssignRoleAsync(int id, [FromBody] AdminAssignRoleDto dto)
        {
            await _adminUserService.AssignRole(id, dto.Role, GetCurrentUserId());

            return Ok(new
            {
                message = $"Assign role {dto.Role} to user with id {id} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _adminUserService.DeleteUser(id, GetCurrentUserId());

            return Ok(new
            {
                message = $"Deactivate user with id {id} successfully!"
            });
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new AppHttpException(StatusCodes.Status401Unauthorized, "Không thể xác định người dùng. Token không hợp lệ.");
            }

            return int.Parse(userIdClaim.Value);
        }
    }
}
