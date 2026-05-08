using AutoMapper;
using TheALMAProject.Application.DTOs.BaseProductDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class BaseProductMapping : Profile
    {
        public BaseProductMapping()
        {
            CreateMap<BaseProduct, BaseProductDto>();
            CreateMap<BaseProduct, BaseProductListDto>();
            CreateMap<CreateBaseProductDto, BaseProduct>();
            CreateMap<UpdateBaseProductDto, BaseProduct>();
        }
    }
}
