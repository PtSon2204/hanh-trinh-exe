namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO đổi mật khẩu khi user đã đăng nhập.
    /// Yêu cầu nhập đúng mật khẩu cũ trước khi đổi sang mật khẩu mới.
    /// </summary>
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}
