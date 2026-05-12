using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route("api/admin/user-designs")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUserDesignController : ControllerBase
    {
        private readonly IAdminUserDesignService _adminUserDesignService;

        public AdminUserDesignController(IAdminUserDesignService adminUserDesignService)
        {
            _adminUserDesignService = adminUserDesignService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUserDesigns([FromQuery] PaginationParams paginationParams)
        {
            var result = await _adminUserDesignService.GetUserDesigns(paginationParams);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUserDesignById(int id)
        {
            var result = await _adminUserDesignService.GetUserDesignById(id);
            if (result == null)
            {
                return NotFound(new { message = $"User design with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUserDesign(int id)
        {
            await _adminUserDesignService.DeleteUserDesign(id);
            return Ok(new
            {
                message = $"Delete user design with id {id} successfully!"
            });
        }
    }
}
