using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.OrderDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class OrderMapping : Profile
    {
        public OrderMapping()
        {
            CreateMap<Order, OrderResponseDto>();
            // Detail Order
            CreateMap<Order, OrderDetailResponseDto>()
                .ForMember(dest => dest.VoucherCode, opt => opt.MapFrom(src => src.Voucher != null ? src.Voucher.Code : null))
                .ForMember(dest => dest.VoucherDiscountPercent, opt => opt.MapFrom(src => src.Voucher != null ? src.Voucher.DiscountPercent : (decimal?)null))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems));

            // 3. Map từng Item trong Order
            CreateMap<OrderItem, OrderItemResponseDto>()
                .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product.Name : src.Design.DesignName)) 
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product.ImageUrl : src.Design.PreviewImageUrl)); 
        }
    }
}
