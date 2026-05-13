using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;

        public OrderRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<Order>> GetOrdersByUserIdAsync(int userId, OrderQuery queryParams)
        {
            var query = _context.Orders.Where(o => o.UserId == userId).AsQueryable();

            if (!string.IsNullOrEmpty(queryParams.OrderStatus))
            {
                query = query.Where(o => o.OrderStatus == queryParams.OrderStatus);
            }

            if (!string.IsNullOrEmpty(queryParams.PaymentStatus))
            {
                query = query.Where(o => o.PaymentStatus == queryParams.PaymentStatus);
            }

            if (!string.IsNullOrEmpty(queryParams.SearchKeyword))
            {
                query = query.Where(o => o.OrderCode.Contains(queryParams.SearchKeyword));
            }

            if (queryParams.FromDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= queryParams.FromDate.Value);
            }

            if (queryParams.ToDate.HasValue)
            {
                var toDateEnd = queryParams.ToDate.Value.AddDays(1).AddTicks(-1);
                query = query.Where(o => o.CreatedAt <= toDateEnd);
            }

            var totalRecords = await query.CountAsync();

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return new PagedResult<Order>
            {
                Data = items,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)queryParams.PageSize)
            };
        }

        public async Task<Order?> GetOrderDetailAsync(int orderId, int userId)
        {
            return await _context.Orders
                .Include(o => o.Voucher) 
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Design)  
                .FirstOrDefaultAsync(o => o.OrderId == orderId && o.UserId == userId);
        }

        public async Task<bool> IsProductPurchasedAndCompletedAsync(int userId, int productId, int orderId)
        {
            return await _context.Orders
                .Include(o => o.OrderItems)
                .AnyAsync(o =>
                    o.OrderId == orderId &&
                    o.UserId == userId &&
                    o.OrderStatus == "Completed" && // CHỈ cho phép review khi đơn đã hoàn thành/giao thành công
                    o.OrderItems.Any(i => i.ProductId == productId)); // Có chứa sản phẩm này trong đơn
        }

        public async Task<PagedResult<Order>> GetAdminOrdersAsync(PaginationParams queryParams)
        {
            var query = _context.Orders
                .Include(o => o.User)
                .AsQueryable();

            var totalRecords = await query.CountAsync();

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync();

            return new PagedResult<Order>
            {
                Data = items,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize,
                TotalRecords = totalRecords,
                TotalPages = (int)Math.Ceiling(totalRecords / (double)queryParams.PageSize)
            };
        }

        public async Task<Order?> GetAdminOrderDetailAsync(int orderId)
        {
            return await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(i => i.Design)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);
        }

        public void UpdateOrder(Order order)
        {
            _context.Orders.Update(order);
        }
        public async Task AddAsync(Order order)
        {
            await _context.Orders.AddAsync(order);
        }
        public async Task<Order?> GetByOrderCodeAsync(string orderCode)
        {
            return await _context.Orders.FirstOrDefaultAsync(o => o.OrderCode == orderCode);
        }
    }
}
