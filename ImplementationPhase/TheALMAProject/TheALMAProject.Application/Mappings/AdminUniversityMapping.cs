using AutoMapper;
using TheALMAProject.Application.DTOs.AdminUniversityDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminUniversityMapping : Profile
    {
        public AdminUniversityMapping()
        {
            CreateMap<University, AdminUniversityDto>();
            CreateMap<University, AdminUniversityListDto>();
            CreateMap<AdminCreateUniversityDto, University>();
            CreateMap<AdminUpdateUniversityDto, University>();
        }
    }
}
