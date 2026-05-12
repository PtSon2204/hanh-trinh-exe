namespace TheALMAProject.Application.DTOs.ProfileDtos
{
    /// <summary>
    /// UC-22: DTO cập nhật thông tin cá nhân (chỉ tên, SĐT)
    /// Email và password sửa ở UC khác (Auth)
    /// </summary>
    public class UpdateProfileDto
    {
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
    }
}
