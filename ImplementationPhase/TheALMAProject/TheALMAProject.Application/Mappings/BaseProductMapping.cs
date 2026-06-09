using AutoMapper;
using TheALMAProject.Application.DTOs.BaseProductDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class BaseProductMapping : Profile
    {
        public BaseProductMapping()
        {
            CreateMap<BaseProduct3DConfig, BaseProduct3DConfigDto>();
            CreateMap<BaseProduct3DConfigDto, BaseProduct3DConfig>()
                .ForMember(dest => dest.BaseProduct3DConfigId, opt => opt.Ignore())
                .ForMember(dest => dest.BaseProductId, opt => opt.Ignore())
                .ForMember(dest => dest.BaseProduct, opt => opt.Ignore());
            CreateMap<BaseProduct, BaseProductDto>();
            CreateMap<BaseProduct, BaseProductListDto>();
            CreateMap<CreateBaseProductDto, BaseProduct>();
            CreateMap<UpdateBaseProductDto, BaseProduct>();
        }
    }
}
