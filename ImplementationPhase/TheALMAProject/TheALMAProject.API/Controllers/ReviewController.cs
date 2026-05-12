using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.ReviewDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        [HttpGet("product/{productId}")]
        public async Task<IActionResult> GetProductReviews(int productId, [FromQuery] PaginationParams queryParams)
        {
            var result = await _reviewService.GetReviewsAsync(productId, queryParams);
            return Ok(result);
        }

        // Phải đăng nhập mới được tạo
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequestDto request)
        {
            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest("Số sao đánh giá phải từ 1 đến 5.");
            }

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var success = await _reviewService.CreateReviewAsync(currentUserId, request);

            if (!success)
            {
                return BadRequest(new { message = "Bạn không thể đánh giá sản phẩm này. Có thể bạn chưa mua, đơn hàng chưa hoàn thành, hoặc bạn đã đánh giá rồi." });
            }

            return Ok(new { message = "Cảm ơn bạn đã đánh giá sản phẩm!" });
        }
    }
}
