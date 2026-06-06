using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    /// <summary>
    /// Public API cho Customer xem sản phẩm (không cần đăng nhập)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;

        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        /// <summary>
        /// Danh sách sản phẩm với lọc, sắp xếp, phân trang
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] StoreProductQuery query)
        {
            var result = await _productService.GetProductsAsync(query);
            return Ok(result);
        }

        [HttpGet("filter-options")]
        public async Task<IActionResult> GetFilterOptions()
        {
            var result = await _productService.GetProductFilterOptionsAsync();
            return Ok(result);
        }

        /// <summary>
        ///Chi tiết sản phẩm 
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetProductDetail(int id)
        {
            var result = await _productService.GetProductDetailAsync(id);

            if (result == null)
            {
                return NotFound(new { message = $"Sản phẩm với id {id} không tồn tại hoặc đã ngừng bán." });
            }

            return Ok(result);
        }

        /// <summary>
        /// Sản phẩm liên quan
        /// </summary>
        [HttpGet("{id:int}/related")]
        public async Task<IActionResult> GetRelatedProducts(int id, [FromQuery] int count = 4)
        {
            var result = await _productService.GetRelatedProductsAsync(id, count);
            return Ok(result);
        }

        /// <summary>
        /// UC-10: Tìm kiếm sản phẩm theo từ khoá (AJAX real-time)
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts([FromQuery] string keyword, [FromQuery] int maxResults = 10)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return Ok(new List<object>());
            }

            var result = await _productService.SearchProductsAsync(keyword, maxResults);
            return Ok(result);
        }
    }
}
