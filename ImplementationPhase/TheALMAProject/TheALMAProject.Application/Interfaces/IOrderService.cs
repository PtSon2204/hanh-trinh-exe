using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IOrderService
    {
        Task<PagedResult<OrderResponseDto>> GetUserOrdersAsync(int userId, OrderQuery query);
        Task<OrderDetailResponseDto?> GetOrderDetailAsync(int userId, int orderId);
        Task<CheckoutResponseDto> CheckoutAsync(int userId, CheckoutRequestDto request);
    }
}
