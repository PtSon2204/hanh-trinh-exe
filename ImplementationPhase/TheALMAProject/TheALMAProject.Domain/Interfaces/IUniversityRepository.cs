using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUniversityRepository
    {
        Task<PagedResult<University>> GetAdminUniversities(AdminUniversityQuery query);
        Task<University?> GetById(int id);
        Task<University?> GetByName(string name);
        Task CreateUniversity(University university);
        void UpdateUniversity(University university);
        void DeleteUniversity(University university);
    }
}
