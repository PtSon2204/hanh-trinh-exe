using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.BaseProductDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/Admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Product Manager")]
    public class BaseProductController : ControllerBase
    {
        private readonly IAdminBaseProductService _baseProductService;

        public BaseProductController(IAdminBaseProductService baseProductService)
        {
            _baseProductService = baseProductService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetBaseProductById(int id)
        {
            var result = await _baseProductService.GetBaseProductById(id);

            if (result == null)
            {
                return NotFound($"Base Product with id {id} not found!");
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] BaseProductQuery query)
        {
            var result = await _baseProductService.GetBaseProducts(query);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateBaseProductDto dto)
        {
            await _baseProductService.CreateBaseProduct(dto);

            return Ok(new
            {
                message = $"Create {dto.Name} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateBaseProductDto dto)
        {
            await _baseProductService.UpdateBaseProduct(id, dto);

            return Ok(new
            {
                message = $"Update {dto.Name} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _baseProductService.DeleteBaseProduct(id);

            return Ok(new
            {
                message = $"Delete base product with id {id} successfully!"
            });
        }
    }
}
