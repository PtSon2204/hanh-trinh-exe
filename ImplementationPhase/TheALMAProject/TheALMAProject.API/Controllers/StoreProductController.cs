using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.StoreProductDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/Admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Product Manager")]
    public class StoreProductController : ControllerBase
    {
        private readonly IAdminStoreProductService _storeProductService;

        public StoreProductController(IAdminStoreProductService storeProductService)
        {
            _storeProductService = storeProductService;
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetStoreProductById(int id)
        {
            var result = await _storeProductService.GetStoreProductById(id);

            if (result == null)
            {
                return NotFound($"Store Product with id {id} not found!");
            }

            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> Pagination([FromQuery] StoreProductQuery query)
        {
            var result = await _storeProductService.GetStoreProducts(query);

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAsync([FromBody] CreateStoreProductDto dto)
        {
            await _storeProductService.CreateStoreProduct(dto);

            return Ok(new
            {
                message = $"Create {dto.Name} successfully!"
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateAsync(int id, [FromBody] UpdateStoreProductDto dto)
        {
            await _storeProductService.UpdateStoreProduct(id, dto);

            return Ok(new
            {
                message = $"Update {dto.Name} successfully!"
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAsync(int id)
        {
            await _storeProductService.DeleteStoreProduct(id);

            return Ok(new
            {
                message = $"Delete store product with id {id} successfully!"
            });
        }
    }
}
