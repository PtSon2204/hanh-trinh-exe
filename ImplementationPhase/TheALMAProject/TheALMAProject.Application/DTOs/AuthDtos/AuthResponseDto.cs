namespace TheALMAProject.Application.DTOs.AuthDtos
{
    /// <summary>
    /// DTO trả về cho client sau khi login/register thành công.
    /// Chứa JWT token để client gửi kèm ở mọi request tiếp theo.
    /// </summary>
    public class AuthResponseDto
    {
        public string Token { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime Expiration { get; set; }
    }
}
