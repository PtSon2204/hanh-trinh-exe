using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class ReviewRepository : IReviewRepository
    {
        private readonly ApplicationDbContext _context;

        public ReviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Review>> GetReviewsByProductIdAsync(int productId, PaginationParams queryParams)
        {
            var query = _context.Reviews
                .Include(r => r.User) // Lấy thông tin người review để hiện tên/avatar
                .Where(r => r.ProductId == productId)
                .OrderByDescending(r => r.CreatedAt); // Review mới nhất lên đầu

            var totalRecords = await query.CountAsync();
            var items = await query
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return new PagedResult<Review>
            {
                Data = items,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)queryParams.PageSize)
            };
        }

        public async Task AddReviewAsync(Review review)
        {
            await _context.Reviews.AddAsync(review);
        }

        public async Task<bool> HasReviewedAsync(int userId, int productId, int orderId)
        {
            return await _context.Reviews.AnyAsync(r =>
                r.UserId == userId &&
                r.ProductId == productId &&
                r.OrderId == orderId);
        }
    }
}
