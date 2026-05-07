using TheALMAProject.Application.DTOs.AuthDtos;

namespace TheALMAProject.Application.Interfaces
{
    /// <summary>
    /// Interface định nghĩa các nghiệp vụ xác thực người dùng.
    /// Được implement bởi AuthService ở Application layer.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Đăng ký tài khoản mới. Tạo user với IsActive=false, gửi OTP qua email.
        /// </summary>
        Task<string> RegisterAsync(RegisterDto dto);

        /// <summary>
        /// Gửi lại mã OTP cho email (trường hợp OTP cũ hết hạn).
        /// </summary>
        Task SendOtpAsync(string email);

        /// <summary>
        /// Xác thực OTP → Kích hoạt tài khoản → Trả về JWT token.
        /// </summary>
        Task<AuthResponseDto> VerifyOtpAsync(VerifyOtpDto dto);

        /// <summary>
        /// Đăng nhập bằng email + password → Trả về JWT token.
        /// </summary>
        Task<AuthResponseDto> LoginAsync(LoginDto dto);

        /// <summary>
        /// Đăng nhập bằng Google/Facebook OAuth → Trả về JWT token.
        /// Nếu user chưa tồn tại → tự động tạo tài khoản mới.
        /// </summary>
        Task<AuthResponseDto> OAuthLoginAsync(OAuthLoginDto dto);

        /// <summary>
        /// Đăng xuất - xóa RefreshToken trong DB.
        /// </summary>
        Task LogoutAsync(int userId);

        /// <summary>
        /// Gửi link/token reset password qua email.
        /// </summary>
        Task ForgotPasswordAsync(ForgotPasswordDto dto);

        /// <summary>
        /// Reset password bằng token nhận được qua email.
        /// </summary>
        Task ResetPasswordAsync(ResetPasswordDto dto);

        /// <summary>
        /// Đổi mật khẩu khi đã đăng nhập (cần xác thực mật khẩu cũ).
        /// </summary>
        Task ChangePasswordAsync(int userId, ChangePasswordDto dto);
    }
}
