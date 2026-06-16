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
            var products = _context.StoreProducts
                .Include(x => x.BaseProduct)
                .Include(x => x.University)
                .Include(x => x.Reviews)
                .AsNoTracking()
                .AsQueryable();

            // Filter theo tên SP (không phân biệt hoa thường)
            if (!string.IsNullOrWhiteSpace(query.Name))
            {
                products = products.Where(x => x.Name.ToLower().Contains(query.Name.ToLower()));
            }

            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                var keyword = query.Keyword.ToLower();
                products = products.Where(x => x.Name.ToLower().Contains(keyword)
                    || (x.Description != null && x.Description.ToLower().Contains(keyword))
                    || (x.BaseProduct != null && x.BaseProduct.Category.ToLower().Contains(keyword))
                    || (x.BaseProduct != null && x.BaseProduct.Material.ToLower().Contains(keyword))
                    || (x.University != null && x.University.Name.ToLower().Contains(keyword)));
            }

            if (query.BaseProductId.HasValue)
            {
                products = products.Where(x => x.BaseProductId == query.BaseProductId.Value);
            }

            if (query.HasBaseProduct.HasValue)
            {
                products = query.HasBaseProduct.Value
                    ? products.Where(x => x.BaseProductId != null)
                    : products.Where(x => x.BaseProductId == null);
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

            // Filter theo University (Trường học)
            if (!string.IsNullOrWhiteSpace(query.University))
            {
                products = products.Where(x => x.University != null && x.University.Name.ToLower().Contains(query.University.ToLower()));
            }

            // UC-08: Filter theo Category (kiểu dáng) từ BaseProduct (không phân biệt hoa thường, partial match)
            if (!string.IsNullOrWhiteSpace(query.Category))
            {
                products = products.Where(x => x.BaseProduct != null && x.BaseProduct.Category.ToLower().Contains(query.Category.ToLower()));
            }

            // UC-08: Filter theo Material (chất liệu) từ BaseProduct (không phân biệt hoa thường, partial match)
            if (!string.IsNullOrWhiteSpace(query.Material))
            {
                products = products.Where(x => x.BaseProduct != null && x.BaseProduct.Material.ToLower().Contains(query.Material.ToLower()));
            }

            // UC-08: Filter khoảng giá
            if (query.MinPrice.HasValue)
            {
                products = products.Where(x => x.Price >= query.MinPrice.Value);
            }

            if (query.MaxPrice.HasValue)
            {
                products = products.Where(x => x.Price <= query.MaxPrice.Value);
            }

            // UC-08: Sorting
            products = query.SortBy?.ToLower() switch
            {
                "price" => query.SortDescending
                    ? products.OrderByDescending(x => x.Price)
                    : products.OrderBy(x => x.Price),
                "name" => query.SortDescending
                    ? products.OrderByDescending(x => x.Name)
                    : products.OrderBy(x => x.Name),
                "newest" => products.OrderByDescending(x => x.ProductId),
                _ => products.OrderByDescending(x => x.ProductId) // mặc định: mới nhất
            };

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

        public async Task<List<StoreProduct>> GetActiveStoreProductsForFilterOptions()
        {
            return await _context.StoreProducts
                .Include(x => x.BaseProduct)
                .Include(x => x.University)
                .AsNoTracking()
                .Where(x => x.IsActive)
                .ToListAsync();
        }

        // UC-09: Lấy chi tiết SP kèm BaseProduct, University, Reviews → User
        public async Task<StoreProduct?> GetProductDetailById(int id)
        {
            return await _context.StoreProducts
                .Include(x => x.BaseProduct)
                .Include(x => x.University)
                .Include(x => x.Reviews)
                    .ThenInclude(r => r.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ProductId == id);
        }

        // UC-09: Lấy SP liên quan (cùng BaseProduct hoặc University, loại trừ SP hiện tại)
        public async Task<List<StoreProduct>> GetRelatedProducts(int productId, int count)
        {
            var product = await _context.StoreProducts
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ProductId == productId);

            if (product == null) return new List<StoreProduct>();

            return await _context.StoreProducts
                .Include(x => x.BaseProduct)
                .Include(x => x.University)
                .Include(x => x.Reviews)
                .AsNoTracking()
                .Where(x => x.ProductId != productId
                    && x.IsActive
                    && (x.BaseProductId == product.BaseProductId || x.UniversityId == product.UniversityId))
                .OrderByDescending(x => x.ProductId)
                .Take(count)
                .ToListAsync();
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

        // UC-10: Tìm kiếm sản phẩm theo từ khoá
        public async Task<List<StoreProduct>> SearchProductsAsync(string keyword, int maxResults)
        {
            var lowerKeyword = keyword.ToLower();

            return await _context.StoreProducts
                .Include(x => x.BaseProduct)
                .Include(x => x.University)
                .AsNoTracking()
                .Where(x => x.IsActive
                    && (x.Name.ToLower().Contains(lowerKeyword)
                        || (x.Description != null && x.Description.ToLower().Contains(lowerKeyword))
                        || (x.BaseProduct != null && x.BaseProduct.Category.ToLower().Contains(lowerKeyword))
                        || (x.University != null && x.University.Name.ToLower().Contains(lowerKeyword))))
                .OrderByDescending(x => x.ProductId)
                .Take(maxResults)
                .ToListAsync();
        }
    }
}
