namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO nhận dữ liệu đăng nhập bằng email + password.
    /// </summary>
    public class LoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
