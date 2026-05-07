namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO gửi yêu cầu quên mật khẩu.
    /// Server sẽ gửi reset token qua email này.
    /// </summary>
    public class ForgotPasswordDto
    {
        public string Email { get; set; } = null!;
    }
}
