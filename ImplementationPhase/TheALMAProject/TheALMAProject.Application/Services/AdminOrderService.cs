using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;

namespace TheALMAProject.Application.Services
{
    public class AdminOrderService : IAdminOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminOrderService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<AdminOrderListDto>> GetOrders(PaginationParams query)
        {
            var result = await _unitOfWork.OrderRepo.GetAdminOrdersAsync(query);

            return new PagedResult<AdminOrderListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminOrderListDto>>(result.Data)
            };
        }

        public async Task<AdminOrderDto?> GetOrderById(int id)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                return null;
            }

            return _mapper.Map<AdminOrderDto>(order);
        }

        public async Task UpdateOrderStatus(int id, AdminUpdateOrderStatusDto dto)
        {
            var order = await _unitOfWork.OrderRepo.GetAdminOrderDetailAsync(id);
            if (order == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "Order not found");
            }

            order.OrderStatus = dto.OrderStatus;
            order.PaymentStatus = dto.PaymentStatus;

            _unitOfWork.OrderRepo.UpdateOrder(order);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
