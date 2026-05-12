using TheALMAProject.Application.DTOs.AdminVoucherDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminVoucherService
    {
        Task<PagedResult<AdminVoucherListDto>> GetVouchers(AdminVoucherQuery query);

        Task<AdminVoucherDto?> GetVoucherById(int id);

        Task<AdminVoucherDto> CreateVoucher(AdminCreateVoucherDto dto);

        Task<AdminVoucherDto> UpdateVoucher(int id, AdminUpdateVoucherDto dto);

        Task DeleteVoucher(int id);
    }
}
