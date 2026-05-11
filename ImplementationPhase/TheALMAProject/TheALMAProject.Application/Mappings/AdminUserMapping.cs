using AutoMapper;
using TheALMAProject.Application.DTOs.AdminUserDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminUserMapping : Profile
    {
        public AdminUserMapping()
        {
            CreateMap<User, AdminUserDto>();
            CreateMap<User, AdminUserListDto>();
            CreateMap<AdminCreateUserDto, User>();
            CreateMap<AdminUpdateUserDto, User>();
        }
    }
}
