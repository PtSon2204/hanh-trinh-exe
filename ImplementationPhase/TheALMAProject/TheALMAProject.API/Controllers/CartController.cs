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
    [Authorize]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
        }

        private int? GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
                return null;
            return userId;
        }


        [HttpGet("my-cart")]
        public async Task<IActionResult> GetMyCart()
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });

            var cart = await _cartService.GetMyCartAsync(userId.Value);
            return Ok(cart);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartDto request)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });

            if (request.Quantity <= 0)
                return BadRequest(new { message = "Số lượng không hợp lệ." });

            var result = await _cartService.AddToCartAsync(userId.Value, request);

            if (result)
                return Ok(new { message = "Thêm vào giỏ hàng thành công!" });

            return BadRequest(new { message = "Lỗi khi thêm vào giỏ hàng." });
        }

        [HttpPut("update-item/{cartItemId}")]
        public async Task<IActionResult> UpdateCartItem(int cartItemId, [FromBody] UpdateCartItemDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });

            if (dto.Quantity <= 0)
                return BadRequest(new { message = "Số lượng không hợp lệ." });

            var result = await _cartService.UpdateCartItemAsync(userId.Value, cartItemId, dto);

            if (result)
                return Ok(new { message = "Cập nhật thành công!" });

            return BadRequest(new { message = "Không thể cập nhật. Sản phẩm không thuộc giỏ hàng của bạn." });
        }

        [HttpDelete("remove-item/{cartItemId}")]
        public async Task<IActionResult> RemoveCartItem(int cartItemId)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });

            var result = await _cartService.RemoveCartItemAsync(userId.Value, cartItemId);

            if (result)
                return Ok(new { message = "Đã xóa khỏi giỏ hàng!" });

            return BadRequest(new { message = "Không thể xóa. Sản phẩm không thuộc giỏ hàng của bạn." });
        }

        [HttpPost("add-multi")]
        public async Task<IActionResult> AddMultiSize([FromBody] AddDesignMultiSizeDto dto)
        {
            var userId = GetCurrentUserId();
            if (userId == null)
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });

            if (dto.Items == null || !dto.Items.Any(i => i.Quantity > 0))
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 size với số lượng > 0." });

            var result = await _cartService.AddMultiSizeAsync(userId.Value, dto);

            if (result)
                return Ok(new { message = "Đã thêm vào giỏ hàng thành công!" });

            return BadRequest(new { message = "Không thể thêm vào giỏ hàng. Vui lòng kiểm tra lại." });
        }
    }
}
