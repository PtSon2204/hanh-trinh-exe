using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Contracts;
using TheALMAProject.Application.DTOs.AdminUniversityDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers.Admin
{
    [Route(AdminUniversityContract.AdminUniversityRoutePrefix)]
    [ApiController]
    [Authorize(Roles = "Admin,Product Manager")]
    public class AdminUniversityController : ControllerBase
    {
        private readonly IAdminUniversityService _adminUniversityService;

        public AdminUniversityController(IAdminUniversityService adminUniversityService)
        {
            _adminUniversityService = adminUniversityService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetUniversityById(int id)
        {
            var result = await _adminUniversityService.GetUniversityById(id);

            if (result == null)
            {
                return NotFound(new { message = $"University with id {id} not found!" });
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] AdminUniversityQuery query)
        {
            var result = await _adminUniversityService.GetUniversities(query);

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateAsync([FromBody] AdminCreateUniversityDto dto)
        {
            await _adminUniversityService.CreateUniversity(dto);

            return Ok(new
            {
                message = $"Create university {dto.Name} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] AdminUpdateUniversityDto dto)
        {
            await _adminUniversityService.UpdateUniversity(id, dto);

            return Ok(new
            {
                message = $"Update university {dto.Name} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _adminUniversityService.DeleteUniversity(id);

            return Ok(new
            {
                message = $"Deactivate university with id {id} successfully!"
            });
        }
    }
}
