using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.ProfileDtos;

namespace TheALMAProject.Application.Interfaces
{
    /// <summary>
    /// UC-22: Service quản lý hồ sơ cá nhân + sổ địa chỉ
    /// </summary>
    public interface IProfileService
    {
        // === Profile ===
        Task<ProfileDto> GetProfileAsync(int userId);
        Task UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<string> UploadAvatarAsync(int userId, IFormFile file);

        // === Address Book ===
        Task<List<AddressDto>> GetAddressesAsync(int userId);
        Task<AddressDto> AddAddressAsync(int userId, CreateAddressDto dto);
        Task UpdateAddressAsync(int userId, int addressId, UpdateAddressDto dto);
        Task DeleteAddressAsync(int userId, int addressId);
        Task SetDefaultAddressAsync(int userId, int addressId);
    }
}
