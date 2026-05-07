using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.AuthDtos;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.API.Controllers
{
   
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        // POST /api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var message = await _authService.RegisterAsync(dto);
            return Ok(new { message });
        }
     
        // POST /api/auth/verify-otp
        [HttpPost("verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto dto)
        {
            var result = await _authService.VerifyOtpAsync(dto);
            return Ok(result);
        }

        // POST /api/auth/resend-otp?email=xxx
        [HttpPost("resend-otp")]
        public async Task<IActionResult> ResendOtp([FromQuery] string email)
        {
            await _authService.SendOtpAsync(email);
            return Ok(new { message = "Đã gửi lại mã OTP. Vui lòng kiểm tra email." });
        }


        // POST /api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }


        // POST /api/auth/oauth-login
        // Frontend gửi IdToken nhận được từ Google/Facebook SDK
        [HttpPost("oauth-login")]
        public async Task<IActionResult> OAuthLogin([FromBody] OAuthLoginDto dto)
        {
            var result = await _authService.OAuthLoginAsync(dto);
            return Ok(result);
        }

     
        // POST /api/auth/logout
        // [Authorize] = Yêu cầu có JWT hợp lệ, nếu không → 401 Unauthorized

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // Lấy UserId từ JWT Claims (đã được middleware Authentication parse sẵn)
            var userId = GetCurrentUserId();
            await _authService.LogoutAsync(userId);
            return Ok(new { message = "Đăng xuất thành công." });
        }

         
        // POST /api/auth/forgot-password
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            await _authService.ForgotPasswordAsync(dto);
            // Luôn trả success (bảo mật: không tiết lộ email có tồn tại hay không)
            return Ok(new { message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu." });
        }

         
        // POST /api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            await _authService.ResetPasswordAsync(dto);
            return Ok(new { message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
        }

         
        // PUT /api/auth/change-password
        [Authorize]
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userId = GetCurrentUserId();
            await _authService.ChangePasswordAsync(userId, dto);
            return Ok(new { message = "Đổi mật khẩu thành công." });
        }

         
        // Helper: Lấy UserId từ JWT Claims
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null)
            {
                throw new Exception("Không thể xác định người dùng. Token không hợp lệ.");
            }
            return int.Parse(userIdClaim.Value);
        }
    }
}
