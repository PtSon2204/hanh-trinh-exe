using AutoMapper;
using TheALMAProject.Application.DTOs.AdminVoucherDtos;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Mappings
{
    public class AdminVoucherMapping : Profile
    {
        public AdminVoucherMapping()
        {
            CreateMap<Voucher, AdminVoucherDto>();
            CreateMap<Voucher, AdminVoucherListDto>();
            CreateMap<AdminCreateVoucherDto, Voucher>();
            CreateMap<AdminUpdateVoucherDto, Voucher>();
        }
    }
}
