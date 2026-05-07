namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO xác thực mã OTP sau khi đăng ký.
    /// Client gửi email + mã OTP 6 chữ số đã nhận qua email.
    /// </summary>
    public class VerifyOtpDto
    {
        public string Email { get; set; } = null!;
        public string OtpCode { get; set; } = null!;
    }
}
