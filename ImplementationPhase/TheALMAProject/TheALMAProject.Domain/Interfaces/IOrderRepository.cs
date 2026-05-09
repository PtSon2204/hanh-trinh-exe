using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IOrderRepository
    {
        Task<PagedResult<Order>> GetOrdersByUserIdAsync(int userId, OrderQuery orderRequest);
        Task<Order?> GetOrderDetailAsync(int orderId, int userId);
    }
}
