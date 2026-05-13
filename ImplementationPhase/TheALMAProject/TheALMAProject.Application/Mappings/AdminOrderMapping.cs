using AutoMapper;
using TheALMAProject.Application.DTOs.AdminOrderDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminOrderMapping : Profile
    {
        public AdminOrderMapping()
        {
            CreateMap<Order, AdminOrderListDto>()
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email));

            CreateMap<Order, AdminOrderDto>()
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.OrderItems));

            CreateMap<OrderItem, AdminOrderItemDto>()
                .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product!.Name : src.Design!.DesignName))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product!.ImageUrl : src.Design!.PreviewImageUrl));
        }
    }
}
