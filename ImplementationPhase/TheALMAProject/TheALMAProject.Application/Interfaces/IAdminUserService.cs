using TheALMAProject.Application.DTOs.AdminUserDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminUserService
    {
        Task<PagedResult<AdminUserListDto>> GetUsers(AdminUserQuery query);

        Task<AdminUserDto?> GetUserById(int id);

        Task<AdminUserDto> CreateUser(AdminCreateUserDto dto);

        Task<AdminUserDto> UpdateUser(int id, AdminUpdateUserDto dto, int currentAdminUserId);

        Task<AdminUserDto> AssignRole(int id, string role, int currentAdminUserId);

        Task DeleteUser(int id, int currentAdminUserId);
    }
}
