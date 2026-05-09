using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper; 

        public OrderService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<OrderResponseDto>> GetUserOrdersAsync(int userId, OrderQuery query)
        {
            var pagedOrders = await _unitOfWork.OrderRepo.GetOrdersByUserIdAsync(userId, query);

            var dtoList = _mapper.Map<List<OrderResponseDto>>(pagedOrders.Data);

            return new PagedResult<OrderResponseDto>
            {
                Data = dtoList,
                PageNumber = pagedOrders.PageNumber,
                PageSize = pagedOrders.PageSize,
                TotalRecords = pagedOrders.TotalRecords,
                TotalPages = pagedOrders.TotalPages
            };
        }

        public async Task<OrderDetailResponseDto?> GetOrderDetailAsync(int userId, int orderId)
        {
            var order = await _unitOfWork.OrderRepo.GetOrderDetailAsync(orderId, userId);

            if (order == null) return null;

            return _mapper.Map<OrderDetailResponseDto>(order);
        }
    }
}
