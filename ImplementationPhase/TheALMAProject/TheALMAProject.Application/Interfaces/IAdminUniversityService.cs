using TheALMAProject.Application.DTOs.AdminUniversityDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminUniversityService
    {
        Task<PagedResult<AdminUniversityListDto>> GetUniversities(AdminUniversityQuery query);
        Task<AdminUniversityDto?> GetUniversityById(int id);
        Task<AdminUniversityDto> CreateUniversity(AdminCreateUniversityDto dto);
        Task<AdminUniversityDto> UpdateUniversity(int id, AdminUpdateUniversityDto dto);
        Task DeleteUniversity(int id);
    }
}
