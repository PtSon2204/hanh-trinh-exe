namespace TheALMAProject.Application.DTOs.ProfileDtos
{
    /// <summary>
    /// UC-22: DTO trả về thông tin profile + danh sách địa chỉ
    /// </summary>
    public class ProfileDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string? Phone { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
        public List<AddressDto> Addresses { get; set; } = new();
    }
}
