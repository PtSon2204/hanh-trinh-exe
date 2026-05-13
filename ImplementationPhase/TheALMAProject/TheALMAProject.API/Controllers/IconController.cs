using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.IconDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/Admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Product Manager")]
    
    public class IconController : ControllerBase
    {
        private readonly IAdminIconService _iconService;

        public IconController(IAdminIconService iconService)
        {
            _iconService = iconService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIconById(int id)
        {
            var result = await _iconService.GetIconById(id);

            if (result == null)
            {
                return NotFound($"Icon with id {id} not found!");
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] IconQuery query)
        {
            var result = await _iconService.GetIcons(query);

            return Ok(result);
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateAsync([FromForm] CreateIconDto dto)
        {
            await _iconService.CreateIcon(dto);

            return Ok(new
            {
                message = $"Create {dto.Name} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateAsync(int id, [FromForm] UpdateIconDto dto)
        {
            await _iconService.UpdateIcon(id, dto);

            return Ok(new
            {
                message = $"Update {dto.Name} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _iconService.DeleteIcon(id);

            return Ok(new
            {
                message = $"Delete icon with id {id} successfully!"
            });
        }

    }
}
