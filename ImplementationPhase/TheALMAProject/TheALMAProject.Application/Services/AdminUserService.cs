using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.Constants;
using TheALMAProject.Application.DTOs.AdminUserDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class AdminUserService : IAdminUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminUserService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<AdminUserListDto>> GetUsers(AdminUserQuery query)
        {
            var result = await _unitOfWork.UserRepo.GetAdminUsers(query);

            return new PagedResult<AdminUserListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminUserListDto>>(result.Data)
            };
        }

        public async Task<AdminUserDto?> GetUserById(int id)
        {
            var user = await _unitOfWork.UserRepo.GetById(id);

            return _mapper.Map<AdminUserDto>(user);
        }

        public async Task<AdminUserDto> CreateUser(AdminCreateUserDto dto)
        {
            await EnsureCurrentAdminIsAuthorized();

            EnsureAllowedRole(dto.Role);

            var existingUser = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (existingUser != null)
            {
                throw new AppHttpException(StatusCodes.Status409Conflict, "Email already exists");
            }

            var newUser = new User
            {
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash),
                FullName = dto.FullName,
                Phone = dto.Phone,
                AvatarUrl = dto.AvatarUrl,
                Role = dto.Role,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            await _unitOfWork.UserRepo.CreateUser(newUser);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminUserDto>(newUser);
        }

        public async Task<AdminUserDto> UpdateUser(int id, AdminUpdateUserDto dto, int currentAdminUserId)
        {
            await EnsureCurrentAdminIsAuthorized(currentAdminUserId);

            if (dto.UserId != 0 && dto.UserId != id)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "UserId does not match route id");
            }

            EnsureAllowedRole(dto.Role);

            var user = await GetUserOrThrow(id);
            await EnsureEmailAvailable(dto.Email, id);
            EnsureSafeSelfRoleChange(user, dto.Role, currentAdminUserId);
            EnsureSafeSelfStatusChange(user, dto.IsActive, currentAdminUserId);

            user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.PasswordHash))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash);
            }
            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.AvatarUrl = dto.AvatarUrl;
            user.Role = dto.Role;
            user.IsActive = dto.IsActive;

            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminUserDto>(user);
        }

        public async Task<AdminUserDto> AssignRole(int id, string role, int currentAdminUserId)
        {
            await EnsureCurrentAdminIsAuthorized(currentAdminUserId);

            EnsureAllowedRole(role);

            var user = await GetUserOrThrow(id);
            EnsureSafeSelfRoleChange(user, role, currentAdminUserId);

            user.Role = role;

            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminUserDto>(user);
        }

        public async Task DeleteUser(int id, int currentAdminUserId)
        {
            await EnsureCurrentAdminIsAuthorized(currentAdminUserId);

            var user = await GetUserOrThrow(id);

            EnsureNotSelfTarget(user.UserId, currentAdminUserId, "Admin cannot deactivate their own account");

            user.IsActive = false;

            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<User> GetUserOrThrow(int id)
        {
            var user = await _unitOfWork.UserRepo.GetById(id);
            if (user == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "User not found");
            }

            return user;
        }

        private async Task EnsureEmailAvailable(string email, int userId)
        {
            var duplicateUser = await _unitOfWork.UserRepo.GetUserByEmail(email);
            if (duplicateUser != null && duplicateUser.UserId != userId)
            {
                throw new AppHttpException(StatusCodes.Status409Conflict, "Email already exists");
            }
        }

        private static void EnsureAllowedRole(string role)
        {
            if (!UserRoleNames.Allowed.Contains(role))
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Role is not allowed");
            }
        }

        private static void EnsureSafeSelfRoleChange(User user, string requestedRole, int currentAdminUserId)
        {
            if (user.UserId == currentAdminUserId && user.Role != requestedRole)
            {
                throw new AppHttpException(StatusCodes.Status403Forbidden, "Admin cannot change their own role");
            }
        }

        private static void EnsureSafeSelfStatusChange(User user, bool requestedIsActive, int currentAdminUserId)
        {
            if (user.UserId == currentAdminUserId && user.IsActive && !requestedIsActive)
            {
                throw new AppHttpException(StatusCodes.Status403Forbidden, "Admin cannot deactivate their own account");
            }
        }

        private static void EnsureNotSelfTarget(int targetUserId, int currentAdminUserId, string message)
        {
            if (targetUserId == currentAdminUserId)
            {
                throw new AppHttpException(StatusCodes.Status403Forbidden, message);
            }
        }

        private async Task EnsureCurrentAdminIsAuthorized(int? currentAdminUserId = null)
        {
            if (!currentAdminUserId.HasValue)
            {
                return;
            }

            var currentAdmin = await _unitOfWork.UserRepo.GetById(currentAdminUserId.Value);
            if (currentAdmin == null || !currentAdmin.IsActive)
            {
                throw new AppHttpException(StatusCodes.Status401Unauthorized, "Current admin account is no longer active");
            }

            if (currentAdmin.Role != UserRoleNames.Admin)
            {
                throw new AppHttpException(StatusCodes.Status403Forbidden, "Current user no longer has admin access");
            }
        }
    }
}
