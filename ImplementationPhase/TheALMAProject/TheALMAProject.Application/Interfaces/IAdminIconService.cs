using TheALMAProject.Application.DTOs.IconDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminIconService
    {
        Task<PagedResult<IconListDto>> GetIcons(IconQuery query);

        Task<IconDto?> GetIconById(int id);

        Task CreateIcon(CreateIconDto icon);

        Task UpdateIcon(int id, UpdateIconDto icon);

        Task DeleteIcon(int id);
    }
}
