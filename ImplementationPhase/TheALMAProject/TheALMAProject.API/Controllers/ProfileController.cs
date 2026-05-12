using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.ProfileDtos;
using TheALMAProject.Application.Interfaces;

namespace TheALMAProject.API.Controllers
{
    /// <summary>
    /// UC-22: API quản lý hồ sơ cá nhân + sổ địa chỉ
    /// Tất cả endpoint đều yêu cầu đăng nhập (JWT)
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly IProfileService _profileService;

        public ProfileController(IProfileService profileService)
        {
            _profileService = profileService;
        }

        // =====================================================
        // PROFILE
        // =====================================================

        /// <summary>
        /// Xem thông tin cá nhân + danh sách địa chỉ
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetCurrentUserId();
            var result = await _profileService.GetProfileAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Cập nhật tên, SĐT
        /// </summary>
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();
            await _profileService.UpdateProfileAsync(userId, dto);
            return Ok(new { message = "Cập nhật thông tin thành công." });
        }

        /// <summary>
        /// Upload avatar (multipart/form-data)
        /// </summary>
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userId = GetCurrentUserId();
            var avatarUrl = await _profileService.UploadAvatarAsync(userId, file);
            return Ok(new { message = "Cập nhật avatar thành công.", avatarUrl });
        }

        // =====================================================
        // ADDRESS BOOK
        // =====================================================

        /// <summary>
        /// Danh sách địa chỉ
        /// </summary>
        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetCurrentUserId();
            var result = await _profileService.GetAddressesAsync(userId);
            return Ok(result);
        }

        /// <summary>
        /// Thêm địa chỉ mới
        /// </summary>
        [HttpPost("addresses")]
        public async Task<IActionResult> AddAddress([FromBody] CreateAddressDto dto)
        {
            var userId = GetCurrentUserId();
            var result = await _profileService.AddAddressAsync(userId, dto);
            return Ok(new { message = "Thêm địa chỉ thành công.", data = result });
        }

        /// <summary>
        /// Cập nhật địa chỉ
        /// </summary>
        [HttpPut("addresses/{id:int}")]
        public async Task<IActionResult> UpdateAddress(int id, [FromBody] UpdateAddressDto dto)
        {
            var userId = GetCurrentUserId();
            await _profileService.UpdateAddressAsync(userId, id, dto);
            return Ok(new { message = "Cập nhật địa chỉ thành công." });
        }

        /// <summary>
        /// Xóa địa chỉ
        /// </summary>
        [HttpDelete("addresses/{id:int}")]
        public async Task<IActionResult> DeleteAddress(int id)
        {
            var userId = GetCurrentUserId();
            await _profileService.DeleteAddressAsync(userId, id);
            return Ok(new { message = "Xóa địa chỉ thành công." });
        }

        /// <summary>
        /// Đặt địa chỉ mặc định
        /// </summary>
        [HttpPut("addresses/{id:int}/default")]
        public async Task<IActionResult> SetDefaultAddress(int id)
        {
            var userId = GetCurrentUserId();
            await _profileService.SetDefaultAddressAsync(userId, id);
            return Ok(new { message = "Đã đặt địa chỉ mặc định." });
        }

        /// <summary>
        /// Lấy UserId từ JWT token
        /// </summary>
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("UserId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new Exception("Không xác định được người dùng. Vui lòng đăng nhập lại.");
            }

            return userId;
        }
    }
}
