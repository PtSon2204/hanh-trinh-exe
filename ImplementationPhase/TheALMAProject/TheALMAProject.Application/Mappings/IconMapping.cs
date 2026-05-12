using AutoMapper;
using TheALMAProject.Application.DTOs.IconDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class IconMapping : Profile
    {
        public IconMapping()
        {
            CreateMap<Icon, IconDto>();
            CreateMap<Icon, IconListDto>();
            CreateMap<CreateIconDto, Icon>()
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());
            CreateMap<UpdateIconDto, Icon>()
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());
        }
    }
}
