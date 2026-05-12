using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    /// <summary>
    /// UC-22: Repository cho Address (sổ địa chỉ)
    /// </summary>
    public interface IAddressRepository
    {
        Task<List<Address>> GetByUserIdAsync(int userId);
        Task<Address?> GetByIdAsync(int addressId);
        Task AddAsync(Address address);
        void Update(Address address);
        void Delete(Address address);

        /// <summary>
        /// Bỏ tất cả default address của user (trước khi set default mới)
        /// </summary>
        Task ClearDefaultAsync(int userId);
    }
}
