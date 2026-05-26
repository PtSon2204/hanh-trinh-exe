using AutoMapper;
using TheALMAProject.Application.DTOs.AdminUserDesignDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminUserDesignMapping : Profile
    {
        public AdminUserDesignMapping()
        {
            CreateMap<UserDesign, AdminUserDesignListDto>()
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.BaseProductName, opt => opt.MapFrom(src => src.BaseProduct.Name));

            CreateMap<UserDesign, AdminUserDesignDto>()
                .ForMember(dest => dest.UserEmail, opt => opt.MapFrom(src => src.User.Email))
                .ForMember(dest => dest.BaseProductName, opt => opt.MapFrom(src => src.BaseProduct.Name))
                .ForMember(dest => dest.CanvasJson, opt => opt.MapFrom(src => src.FrontCanvasJson ?? src.CanvasJson))
                .ForMember(dest => dest.FrontCanvasJson, opt => opt.MapFrom(src => src.FrontCanvasJson ?? src.CanvasJson));
        }
    }
}
