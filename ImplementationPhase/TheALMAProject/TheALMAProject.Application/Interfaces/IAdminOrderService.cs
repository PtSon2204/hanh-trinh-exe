using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminOrderService
    {
        Task<PagedResult<AdminOrderListDto>> GetOrders(PaginationParams query);
        Task<AdminOrderDto?> GetOrderById(int id);
        Task<IEnumerable<AdminOrderStatisticDto>> GetOrderStatistics(AdminOrderStatisticQuery query);
        Task<IEnumerable<AdminOrderPrintFileDto>> ExportPrintFiles(int id);
        Task UpdateOrderStatus(int id, AdminUpdateOrderStatusDto dto);
    }
}
