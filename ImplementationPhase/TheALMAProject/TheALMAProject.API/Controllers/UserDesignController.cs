using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TheALMAProject.Application.DTOs.UserDesignDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserDesignController : ControllerBase
    {
        private const string CustomizerUploadFolder = "uploads/customizer-images";

        private readonly IUserDesignService _designService;
        private readonly IFileStorageService _fileStorageService;

        public UserDesignController(
            IUserDesignService designService,
            IFileStorageService fileStorageService)
        {
            _designService = designService;
            _fileStorageService = fileStorageService;
        }

        [Authorize]
        [HttpGet("my-designs")]
        public async Task<IActionResult> GetMyDesigns([FromQuery] UserDesignQuery query)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var result = await _designService.GetMyDesignsAsync(currentUserId, query);
            return Ok(result);
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDesign(int id, [FromBody] UpdateUserDesignDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var isSuccess = await _designService.UpdateDesignAsync(currentUserId, id, request);

            if (!isSuccess)
                return BadRequest("Cập nhật thất bại. Bản thiết kế có thể không tồn tại hoặc đã được đặt hàng.");

            return Ok("Bản thiết kế đã được cập nhật thành công!");
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDesign(int id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }
            var message = await _designService.DeleteDesignAsync(currentUserId, id);

            if (message != "Thành công") return BadRequest(message);
            return Ok("Đã xóa bản thiết kế.");
        }

        [AllowAnonymous]
        [HttpGet("share/{id}")]
        public async Task<IActionResult> GetSharedDesign(int id)
        {
            var result = await _designService.GetSharedDesignAsync(id);
            if (result == null) return NotFound("Bản thiết kế không tồn tại hoặc đã bị xóa.");

            return Ok(result);
        }

        [Authorize]
        [HttpPost("upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadCustomizerImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Image file is required" });
            }

            var imageUrl = await _fileStorageService.SaveFileAsync(file, CustomizerUploadFolder);

            return Ok(new { imageUrl });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateDesign([FromBody] CreateUserDesignDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int currentUserId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính. Vui lòng đăng nhập lại." });
            }

            var newDesignId = await _designService.CreateDesignAsync(currentUserId, request);

            if (newDesignId == null)
            {
                return BadRequest("Tạo bản thiết kế thất bại. Vui lòng kiểm tra lại thông tin phôi áo.");
            }

            return Ok(new
            {
                Message = "Đã lưu bản thiết kế thành công!",
                DesignId = newDesignId
            });
        }
    }
}
