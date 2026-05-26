using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpGet("my-orders")]
        public async Task<IActionResult> GetMyOrders([FromQuery] OrderQuery query)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var result = await _orderService.GetUserOrdersAsync(currentUserId, query);

            return Ok(result);
        }

        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrderDetail(int orderId)
        {
            
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var result = await _orderService.GetOrderDetailAsync(currentUserId, orderId);

            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng hoặc bạn không có quyền xem." });
            }

            return Ok(result);
        }

        [Authorize]
        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequestDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var response = await _orderService.CheckoutAsync(currentUserId, request);

            if (!response.IsSuccess)
            {
                return BadRequest(new { message = response.Message });
            }

            return Ok(response);
        }

        [Authorize]
        [HttpPatch("{orderId}/change-payment-method")]
        public async Task<IActionResult> ChangePaymentMethod(int orderId, [FromBody] ChangePaymentMethodRequestDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var success = await _orderService.ChangePaymentMethodAsync(currentUserId, orderId, request.PaymentMethod);

            if (!success)
            {
                return BadRequest(new { message = "Không thể thay đổi phương thức thanh toán. Đơn hàng không tồn tại hoặc đã được xử lý." });
            }

            return Ok(new { isSuccess = true, message = "Đã thay đổi phương thức thanh toán thành công." });
        }

        [Authorize]
        [HttpGet("check-voucher")]
        public async Task<IActionResult> CheckVoucher([FromQuery] string code)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "Vui lòng cung cấp mã giảm giá." });
            }

            var result = await _orderService.CheckVoucherAsync(currentUserId, code);

            if (!result.IsValid)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(result);
        }

        [Authorize]
        [HttpPatch("{orderId}/cancel")]
        public async Task<IActionResult> CancelOrder(int orderId, [FromBody] CancelOrderRequest? request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var success = await _orderService.CancelOrderAsync(
                currentUserId, 
                orderId, 
                request?.RefundBankName, 
                request?.RefundAccountNumber, 
                request?.RefundAccountName
            );

            if (!success)
            {
                return BadRequest(new { message = "Không thể hủy đơn hàng. Đơn hàng không tồn tại, đã được giao/hủy hoặc không thuộc quyền sở hữu của bạn." });
            }

            return Ok(new { isSuccess = true, message = "Đã hủy đơn hàng thành công." });
        }

        [Authorize]
        [HttpPatch("{orderId}/address")]
        public async Task<IActionResult> UpdateShippingAddress(int orderId, [FromBody] UpdateShippingAddressDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            if (string.IsNullOrWhiteSpace(request.ShipName) || 
                string.IsNullOrWhiteSpace(request.ShipPhone) || 
                string.IsNullOrWhiteSpace(request.ShipAddress) || 
                string.IsNullOrWhiteSpace(request.ShipProvince))
            {
                return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin nhận hàng." });
            }

            var success = await _orderService.UpdateShippingAddressAsync(currentUserId, orderId, request);

            if (!success)
            {
                return BadRequest(new { message = "Không thể cập nhật địa chỉ. Đơn hàng không tồn tại, đã được xử lý hoặc không thuộc quyền sở hữu của bạn." });
            }

            return Ok(new { isSuccess = true, message = "Đã cập nhật địa chỉ nhận hàng thành công." });
        }
    }
}
