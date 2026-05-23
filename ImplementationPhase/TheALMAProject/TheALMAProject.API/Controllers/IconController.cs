using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IconController : ControllerBase
    {
        private readonly IAdminIconService _iconService;

        public IconController(IAdminIconService iconService)
        {
            _iconService = iconService;
        }

        /// <summary>GET /api/Icon/all — Lấy tất cả icon active cho trang Customizer</summary>
        [AllowAnonymous]
        [HttpGet("all")]
        public async Task<IActionResult> GetAllActiveIcons()
        {
            var query = new IconQuery { PageNumber = 1, PageSize = 50, IsActive = true };
            var result = await _iconService.GetIcons(query);
            return Ok(result);
        }
    }
}
