using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.UserDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        public UserService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task CreateUser(CreateUserDto dto)
        {
            var existingUser = await _unitOfWork.UserRepo.GetUserByEmail(dto.Email);
            if (existingUser != null)
            {
                throw new Exception("Email already exists");
            }

            var newUser = _mapper.Map<User>(dto);

            newUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordHash);

            // 3. Đẩy xuống DB
            await _unitOfWork.UserRepo.CreateUser(newUser);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteUser(string email)
        {
            var user = await _unitOfWork.UserRepo.GetUserByEmail(email);
            _unitOfWork.UserRepo.DeleteUser(user);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<UserDto> GetByEmail(string? email)
        {
            var user = await _unitOfWork.UserRepo.GetUserByEmail(email);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<PagedResult<UserDto>> GetUsers(UserQuery query)
        {
            var result = await _unitOfWork.UserRepo.GetUsers(query);

            return new PagedResult<UserDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,

                Data = _mapper.Map<IEnumerable<UserDto>>(result.Data)
            };
        }

        public async Task UpdateUser(int id, UpdateUserDto dto)
        {
            var user = await _unitOfWork.UserRepo.GetById(id);

            if (user == null)
            {
                throw new Exception("User not found");
            }

            user.FullName = dto.FullName;
            user.Phone = dto.Phone;
            user.AvatarUrl = dto.AvatarUrl;
            user.PasswordHash = dto.PasswordHash;
            
            _unitOfWork.UserRepo.UpdateUser(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}

