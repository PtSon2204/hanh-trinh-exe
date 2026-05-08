using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class StoreProductRepository : IStoreProductRepository
    {
        private readonly ApplicationDbContext _context;

        public StoreProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<StoreProduct>> GetStoreProducts(StoreProductQuery query)
        {
            var products = _context.StoreProducts.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                products = products.Where(x => x.Name.Contains(query.Name));
            }

            if (query.BaseProductId.HasValue)
            {
                products = products.Where(x => x.BaseProductId == query.BaseProductId.Value);
            }

            if (query.UniversityId.HasValue)
            {
                products = products.Where(x => x.UniversityId == query.UniversityId.Value);
            }

            if (query.IsActive.HasValue)
            {
                products = products.Where(x => x.IsActive == query.IsActive.Value);
            }

            if (query.IsCustomizable.HasValue)
            {
                products = products.Where(x => x.IsCustomizable == query.IsCustomizable.Value);
            }

            var totalRecords = await products.CountAsync();
            var data = await products
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<StoreProduct>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<StoreProduct?> GetById(int id)
        {
            return await _context.StoreProducts.FindAsync(id);
        }

        public async Task<StoreProduct?> GetStoreProductByName(string name)
        {
            return await _context.StoreProducts.FirstOrDefaultAsync(x => x.Name == name);
        }

        public async Task CreateStoreProduct(StoreProduct storeProduct)
        {
            await _context.AddAsync(storeProduct);
        }

        public void UpdateStoreProduct(StoreProduct storeProduct)
        {
            _context.Update(storeProduct);
        }

        public void DeleteStoreProduct(StoreProduct storeProduct)
        {
            _context.Remove(storeProduct);
        }
    }
}
