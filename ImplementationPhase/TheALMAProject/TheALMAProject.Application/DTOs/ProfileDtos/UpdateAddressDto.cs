namespace TheALMAProject.Application.DTOs.ProfileDtos
{
    /// <summary>
    /// UC-22: DTO cập nhật địa chỉ
    /// </summary>
    public class UpdateAddressDto
    {
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public string Province { get; set; } = null!;
        public string District { get; set; } = null!;
        public bool IsDefault { get; set; }
    }
}
