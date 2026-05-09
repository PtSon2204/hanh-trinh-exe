namespace TheALMAProject.Application.DTOs.AdminUserDtos
{
    public class AdminUpdateUserDto
    {
        public int UserId { get; set; }

        public string Email { get; set; } = null!;

        public string PasswordHash { get; set; } = null!;

        public string FullName { get; set; } = null!;

        public string? Phone { get; set; }

        public string? AvatarUrl { get; set; }

        public string Role { get; set; } = null!;
    }
}
