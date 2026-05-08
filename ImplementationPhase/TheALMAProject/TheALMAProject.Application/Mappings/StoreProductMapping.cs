using AutoMapper;
using TheALMAProject.Application.DTOs.StoreProductDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class StoreProductMapping : Profile
    {
        public StoreProductMapping()
        {
            CreateMap<StoreProduct, StoreProductDto>();
            CreateMap<StoreProduct, StoreProductListDto>();
            CreateMap<CreateStoreProductDto, StoreProduct>();
            CreateMap<UpdateStoreProductDto, StoreProduct>();
        }
    }
}
