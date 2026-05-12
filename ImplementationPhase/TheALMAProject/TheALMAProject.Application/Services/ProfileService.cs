using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.ProfileDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Models;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Application.Services
{
    /// <summary>
    /// UC-22: Service quản lý hồ sơ cá nhân
    /// - Xem/Cập nhật tên, SĐT
    /// - Upload avatar
    /// - CRUD sổ địa chỉ (thêm/sửa/xóa/đặt mặc định)
    /// </summary>
    public class ProfileService : IProfileService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorage;

        public ProfileService(IUnitOfWork unitOfWork, IMapper mapper, IFileStorageService fileStorage)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _fileStorage = fileStorage;
        }

        // =====================================================
        // PROFILE
        // =====================================================

        /// <summary>
        /// Lấy thông tin profile + danh sách địa chỉ
        /// </summary>
        public async Task<ProfileDto> GetProfileAsync(int userId)
        {
            var user = await _unitOfWork.UserRepo.GetById(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");

            var addresses = await _unitOfWork.AddressRepo.GetByUserIdAsync(userId);

            return new ProfileDto
            {
                UserId = user.UserId,
                Email = user.Email,
                FullName = user.FullName,
                Phone = user.Phone,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt,
                Addresses = _mapper.Map<List<AddressDto>>(addresses)
            };
        }

        /// <summary>
        /// Cập nhật tên, SĐT
        /// </summary>
        public async Task UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _unitOfWork.UserRepo.GetById(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;

            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Upload avatar — lưu vào wwwroot/uploads/avatars/
        /// Xóa avatar cũ nếu có
        /// </summary>
        public async Task<string> UploadAvatarAsync(int userId, IFormFile file)
        {
            var user = await _unitOfWork.UserRepo.GetById(userId);
            if (user == null)
                throw new Exception("Không tìm thấy người dùng.");

            // Xóa avatar cũ
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                await _fileStorage.DeleteFileAsync(user.AvatarUrl);
            }

            // Lưu avatar mới
            var avatarUrl = await _fileStorage.SaveFileAsync(file, "uploads/avatars");

            user.AvatarUrl = avatarUrl;
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();

            return avatarUrl;
        }

        // =====================================================
        // ADDRESS BOOK
        // =====================================================

        /// <summary>
        /// Lấy danh sách địa chỉ của user
        /// </summary>
        public async Task<List<AddressDto>> GetAddressesAsync(int userId)
        {
            var addresses = await _unitOfWork.AddressRepo.GetByUserIdAsync(userId);
            return _mapper.Map<List<AddressDto>>(addresses);
        }

        /// <summary>
        /// Thêm địa chỉ mới
        /// Nếu đánh dấu IsDefault → bỏ default cũ trước
        /// </summary>
        public async Task<AddressDto> AddAddressAsync(int userId, CreateAddressDto dto)
        {
            // Nếu set default → clear default cũ
            if (dto.IsDefault)
            {
                await _unitOfWork.AddressRepo.ClearDefaultAsync(userId);
            }

            var address = new Address
            {
                UserId = userId,
                FullName = dto.FullName,
                Phone = dto.Phone,
                AddressLine = dto.AddressLine,
                Province = dto.Province,
                District = dto.District,
                IsDefault = dto.IsDefault
            };

            await _unitOfWork.AddressRepo.AddAsync(address);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AddressDto>(address);
        }

        /// <summary>
        /// Cập nhật địa chỉ — kiểm tra quyền sở hữu
        /// </summary>
        public async Task UpdateAddressAsync(int userId, int addressId, UpdateAddressDto dto)
        {
            var address = await _unitOfWork.AddressRepo.GetByIdAsync(addressId);
            if (address == null)
                throw new Exception("Không tìm thấy địa chỉ.");

            if (address.UserId != userId)
                throw new Exception("Bạn không có quyền sửa địa chỉ này.");

            // Nếu set default → clear default cũ
            if (dto.IsDefault && !address.IsDefault)
            {
                await _unitOfWork.AddressRepo.ClearDefaultAsync(userId);
            }

            address.FullName = dto.FullName;
            address.Phone = dto.Phone;
            address.AddressLine = dto.AddressLine;
            address.Province = dto.Province;
            address.District = dto.District;
            address.IsDefault = dto.IsDefault;

            _unitOfWork.AddressRepo.Update(address);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Xóa địa chỉ — kiểm tra quyền sở hữu
        /// </summary>
        public async Task DeleteAddressAsync(int userId, int addressId)
        {
            var address = await _unitOfWork.AddressRepo.GetByIdAsync(addressId);
            if (address == null)
                throw new Exception("Không tìm thấy địa chỉ.");

            if (address.UserId != userId)
                throw new Exception("Bạn không có quyền xóa địa chỉ này.");

            _unitOfWork.AddressRepo.Delete(address);
            await _unitOfWork.SaveChangesAsync();
        }

        /// <summary>
        /// Đặt địa chỉ mặc định — clear tất cả default cũ, set default mới
        /// </summary>
        public async Task SetDefaultAddressAsync(int userId, int addressId)
        {
            var address = await _unitOfWork.AddressRepo.GetByIdAsync(addressId);
            if (address == null)
                throw new Exception("Không tìm thấy địa chỉ.");

            if (address.UserId != userId)
                throw new Exception("Bạn không có quyền thay đổi địa chỉ này.");

            // Clear tất cả default cũ
            await _unitOfWork.AddressRepo.ClearDefaultAsync(userId);

            // Set default mới
            address.IsDefault = true;
            _unitOfWork.AddressRepo.Update(address);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
