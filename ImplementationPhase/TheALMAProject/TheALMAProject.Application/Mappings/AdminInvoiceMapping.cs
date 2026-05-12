using AutoMapper;
using TheALMAProject.Application.DTOs.AdminInvoiceDtos;
using TheALMAProject.Domain.Models;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminInvoiceMapping : Profile
    {
        public AdminInvoiceMapping()
        {
            CreateMap<Invoice, AdminInvoiceListDto>()
                .ForMember(dest => dest.OrderCode, opt => opt.MapFrom(src => src.Order.OrderCode))
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Order.UserId))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.Order.User.Email));

            CreateMap<Invoice, AdminInvoiceDto>()
                .ForMember(dest => dest.OrderCode, opt => opt.MapFrom(src => src.Order.OrderCode))
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.Order.UserId))
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.Order.User.Email))
                .ForMember(dest => dest.UserFullName, opt => opt.MapFrom(src => src.Order.User.FullName))
                .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.Order.PaymentMethod))
                .ForMember(dest => dest.PaymentStatus, opt => opt.MapFrom(src => src.Order.PaymentStatus))
                .ForMember(dest => dest.OrderStatus, opt => opt.MapFrom(src => src.Order.OrderStatus))
                .ForMember(dest => dest.Items, opt => opt.MapFrom(src => src.Order.OrderItems));

            CreateMap<OrderItem, AdminInvoiceOrderItemDto>()
                .ForMember(dest => dest.ItemName, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product!.Name : src.Design!.DesignName))
                .ForMember(dest => dest.ImageUrl, opt => opt.MapFrom(src =>
                    src.ProductId.HasValue ? src.Product!.ImageUrl : src.Design!.PreviewImageUrl))
                .ForMember(dest => dest.LineTotal, opt => opt.MapFrom(src => src.UnitPrice * src.Quantity));
        }
    }
}
