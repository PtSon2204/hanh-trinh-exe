using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IIconRepository
    {
        Task<PagedResult<Icon>> GetIcons(IconQuery query);

        Task<Icon?> GetById(int id);

        Task<Icon?> GetIconByName(string name);

        Task CreateIcon(Icon icon);

        void UpdateIcon(Icon icon);

        void DeleteIcon(Icon icon);
    }
}
