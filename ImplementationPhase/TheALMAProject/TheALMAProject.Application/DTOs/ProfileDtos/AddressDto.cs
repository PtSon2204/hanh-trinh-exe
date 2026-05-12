namespace TheALMAProject.Application.DTOs.ProfileDtos
{
    /// <summary>
    /// UC-22: DTO trả về thông tin 1 địa chỉ
    /// </summary>
    public class AddressDto
    {
        public int AddressId { get; set; }
        public string FullName { get; set; } = null!;
        public string Phone { get; set; } = null!;
        public string AddressLine { get; set; } = null!;
        public string Province { get; set; } = null!;
        public string District { get; set; } = null!;
        public bool IsDefault { get; set; }
    }
}
