using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<PagedResult<User>> GetUsers(UserQuery query);
        Task<User?> GetById(int id);
        Task<User?> GetUserByEmail(string email);
        Task<User?> GetUserByOAuth(string provider, string oauthId);
        Task CreateUser(User user);
        void UpdateUser(User user);
        void DeleteUser(User user);
    }
}
