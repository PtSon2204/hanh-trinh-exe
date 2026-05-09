using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<PagedResult<User>> GetUsers(UserQuery query);
        Task<PagedResult<User>> GetAdminUsers(AdminUserQuery query);
        Task<User?> GetById(int id);
        Task<User?> GetUserByEmail(string email);
        Task<User?> GetUserByOAuth(string provider, string oauthId);
        Task CreateUser(User user);
        void UpdateUser(User user);
        void DeleteUser(User user);
    }
}
