using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IOrderRepository
    {
        Task<PagedResult<Order>> GetOrdersByUserIdAsync(int userId, OrderQuery orderRequest);
        Task<Order?> GetOrderDetailAsync(int orderId, int userId);
        Task<bool> IsProductPurchasedAndCompletedAsync(int userId, int productId, int orderId);
        Task<PagedResult<Order>> GetAdminOrdersAsync(PaginationParams queryParams);
        Task<List<Order>> GetAdminOrdersForStatisticsAsync(AdminOrderStatisticQuery queryParams);
        Task<Order?> GetAdminOrderDetailAsync(int orderId);
        void UpdateOrder(Order order);
        Task AddAsync(Order order);
        Task<Order?> GetByOrderCodeAsync(string orderCode);
    }
}
