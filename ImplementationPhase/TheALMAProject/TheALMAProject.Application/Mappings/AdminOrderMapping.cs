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
                    src.ProductId.HasValue ? src.Product!.ImageUrl : src.Design!.PreviewImageUrl))
                .ForMember(dest => dest.PreviewImageUrl, opt => opt.MapFrom(src =>
                    src.Design != null ? src.Design.PreviewImageUrl : null))
                .ForMember(dest => dest.FrontPreviewImageUrl, opt => opt.MapFrom(src =>
                    src.Design != null ? (src.Design.FrontPreviewImageUrl ?? src.Design.PreviewImageUrl) : null))
                .ForMember(dest => dest.BackPreviewImageUrl, opt => opt.MapFrom(src =>
                    src.Design != null ? src.Design.BackPreviewImageUrl : null))
                .ForMember(dest => dest.CanvasJson, opt => opt.MapFrom(src => src.Design != null ? (src.Design.FrontCanvasJson ?? src.Design.CanvasJson) : null))
                .ForMember(dest => dest.FrontCanvasJson, opt => opt.MapFrom(src => src.Design != null ? (src.Design.FrontCanvasJson ?? src.Design.CanvasJson) : null))
                .ForMember(dest => dest.BackCanvasJson, opt => opt.MapFrom(src => src.Design != null ? src.Design.BackCanvasJson : null))
                .ForMember(dest => dest.PrintAreaJson, opt => opt.MapFrom(src => src.Design != null ? src.Design.BaseProduct.PrintAreaJson : null))
                .ForMember(dest => dest.ProductFrontImageUrl, opt => opt.MapFrom(src => src.Design != null ? src.Design.BaseProduct.FrontImageUrl : null))
                .ForMember(dest => dest.ProductBackImageUrl, opt => opt.MapFrom(src => src.Design != null ? src.Design.BaseProduct.BackImageUrl : null))
                .ForMember(dest => dest.RequiresSize, opt => opt.MapFrom(src =>
                    src.DesignId.HasValue || (src.Product != null && src.Product.BaseProductId != null)));
        }
    }
}
