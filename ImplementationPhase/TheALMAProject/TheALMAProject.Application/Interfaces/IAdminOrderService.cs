using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminOrderService
    {
        Task<PagedResult<AdminOrderListDto>> GetOrders(PaginationParams query);
        Task<AdminOrderDto?> GetOrderById(int id);
        Task UpdateOrderStatus(int id, AdminUpdateOrderStatusDto dto);
    }
}
