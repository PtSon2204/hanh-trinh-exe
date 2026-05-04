using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.UserDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IUserService
    {
        Task<PagedResult<UserDto>> GetUsers(UserQuery query);
        Task<UserDto> GetByEmail(string? email);
        Task CreateUser(CreateUserDto dto);
        Task UpdateUser(int id, UpdateUserDto dto);
        Task DeleteUser(string email);
    }
}
