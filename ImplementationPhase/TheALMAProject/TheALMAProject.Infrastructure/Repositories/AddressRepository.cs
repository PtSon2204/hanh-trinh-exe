using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    /// <summary>
    /// UC-22: Repository xử lý Address (sổ địa chỉ)
    /// </summary>
    public class AddressRepository : IAddressRepository
    {
        private readonly ApplicationDbContext _context;

        public AddressRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Address>> GetByUserIdAsync(int userId)
        {
            return await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.AddressId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Address?> GetByIdAsync(int addressId)
        {
            return await _context.Addresses.FindAsync(addressId);
        }

        public async Task AddAsync(Address address)
        {
            await _context.Addresses.AddAsync(address);
        }

        public void Update(Address address)
        {
            _context.Addresses.Update(address);
        }

        public void Delete(Address address)
        {
            _context.Addresses.Remove(address);
        }

        /// <summary>
        /// Bỏ tất cả default address của user
        /// Dùng ExecuteUpdateAsync cho hiệu suất (bulk update, không cần load entity)
        /// </summary>
        public async Task ClearDefaultAsync(int userId)
        {
            await _context.Addresses
                .Where(a => a.UserId == userId && a.IsDefault)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.IsDefault, false));
        }
    }
}
