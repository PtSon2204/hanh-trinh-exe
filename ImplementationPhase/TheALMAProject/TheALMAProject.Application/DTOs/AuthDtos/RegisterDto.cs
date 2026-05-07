namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO nhận dữ liệu đăng ký từ client.
    /// Client gửi email + password gốc (plaintext) → Service sẽ hash trước khi lưu DB.
    /// </summary>
    public class RegisterDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
    }
}
