using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.CartDtos;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        [Authorize] 
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            if (request.Quantity <= 0)
                return BadRequest("Số lượng không hợp lệ.");

            var result = await _cartService.AddToCartAsync(currentUserId, request);

            if (result)
                return Ok(new { message = "Thêm vào giỏ hàng thành công!" });

            return BadRequest(new { message = "Lỗi khi thêm vào giỏ hàng." });
        }
    }
}
