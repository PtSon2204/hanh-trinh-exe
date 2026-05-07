namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO reset mật khẩu sau khi nhận token qua email.
    /// Client gửi email + reset token + mật khẩu mới.
    /// </summary>
    public class ResetPasswordDto
    {
        public string Email { get; set; } = null!;
        public string ResetToken { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
