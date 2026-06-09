using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class BaseProductRepository : IBaseProductRepository
    {
        private readonly ApplicationDbContext _context;

        public BaseProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<BaseProduct>> GetBaseProducts(BaseProductQuery query)
        {
            var baseProducts = _context.BaseProducts
                .Include(x => x.ThreeDConfig)
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                baseProducts = baseProducts.Where(x => x.Name.Contains(query.Name));
            }

            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                baseProducts = baseProducts.Where(x => x.Category.Contains(query.Category));
            }

            if (!string.IsNullOrWhiteSpace(query.Material))
            {
                baseProducts = baseProducts.Where(x => x.Material.Contains(query.Material));
            }

            if (query.IsActive.HasValue)
            {
                baseProducts = baseProducts.Where(x => x.IsActive == query.IsActive.Value);
            }

            var totalRecords = await baseProducts.CountAsync();
            var data = await baseProducts
                .Skip((query.PageNumber - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new PagedResult<BaseProduct>
            {
                Data = data,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)query.PageSize)
            };
        }

        public async Task<BaseProduct?> GetById(int id)
        {
            return await _context.BaseProducts
                .Include(x => x.ThreeDConfig)
                .FirstOrDefaultAsync(x => x.BaseProductId == id);
        }

        public async Task<BaseProduct?> GetBaseProductByName(string name)
        {
            return await _context.BaseProducts.FirstOrDefaultAsync(x => x.Name == name);
        }

        public async Task CreateBaseProduct(BaseProduct baseProduct)
        {
            await _context.AddAsync(baseProduct);
        }

        public void UpdateBaseProduct(BaseProduct baseProduct)
        {
            _context.Update(baseProduct);
        }

        public void DeleteBaseProduct(BaseProduct baseProduct)
        {
            _context.Remove(baseProduct);
        }
    }
}
