using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.UserDesignDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class UserDesignMapping : Profile
    {
        public UserDesignMapping()
        {
            CreateMap<UserDesign, UserDesignResponseDto>()
                .ForMember(dest => dest.CanvasJson, opt => opt.MapFrom(src => src.FrontCanvasJson ?? src.CanvasJson))
                .ForMember(dest => dest.FrontCanvasJson, opt => opt.MapFrom(src => src.FrontCanvasJson ?? src.CanvasJson))
                .ForMember(dest => dest.TotalEstimatedPrice, opt => opt.MapFrom(src =>
                    src.BaseProduct.BasePrice +
                    (src.Icons != null ? src.Icons.Sum(i => i.PriceAddon) : 0) +
                    (src.Fonts != null ? src.Fonts.Sum(f => f.PriceAddon) : 0)
                ));
        }
    }
}
