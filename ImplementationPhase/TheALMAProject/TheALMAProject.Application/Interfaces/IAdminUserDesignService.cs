using TheALMAProject.Application.DTOs.AdminUserDesignDtos;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminUserDesignService
    {
        Task<PagedResult<AdminUserDesignListDto>> GetUserDesigns(PaginationParams paginationParams);
        Task<AdminUserDesignDto?> GetUserDesignById(int id);
        Task DeleteUserDesign(int id);
    }
}
