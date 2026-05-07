namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO đăng nhập bằng Google hoặc Facebook.
    /// Client gửi IdToken nhận được từ Google/Facebook SDK ở phía frontend.
    /// Server sẽ verify token này với Google/Facebook API để lấy thông tin user.
    /// </summary>
    public class OAuthLoginDto
    {
        public string Provider { get; set; } = null!;   // "Google" hoặc "Facebook"
        public string IdToken { get; set; } = null!;     // Token từ Google/Facebook SDK
    }
}
