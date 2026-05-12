using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminUniversityDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class AdminUniversityService : IAdminUniversityService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminUniversityService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<AdminUniversityListDto>> GetUniversities(AdminUniversityQuery query)
        {
            var result = await _unitOfWork.UniversityRepo.GetAdminUniversities(query);

            return new PagedResult<AdminUniversityListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminUniversityListDto>>(result.Data)
            };
        }

        public async Task<AdminUniversityDto?> GetUniversityById(int id)
        {
            var university = await _unitOfWork.UniversityRepo.GetById(id);

            return _mapper.Map<AdminUniversityDto>(university);
        }

        public async Task<AdminUniversityDto> CreateUniversity(AdminCreateUniversityDto dto)
        {
            var normalizedName = NormalizeName(dto.Name);
            var normalizedLogoUrl = NormalizeLogoUrl(dto.LogoUrl);

            await EnsureNameAvailable(normalizedName);

            var university = _mapper.Map<University>(dto);
            university.Name = normalizedName;
            university.LogoUrl = normalizedLogoUrl;

            await _unitOfWork.UniversityRepo.CreateUniversity(university);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminUniversityDto>(university);
        }

        public async Task<AdminUniversityDto> UpdateUniversity(int id, AdminUpdateUniversityDto dto)
        {
            var university = await GetUniversityOrThrow(id);
            var normalizedName = NormalizeName(dto.Name);
            var normalizedLogoUrl = NormalizeLogoUrl(dto.LogoUrl);

            await EnsureNameAvailable(normalizedName, id);

            university.Name = normalizedName;
            university.LogoUrl = normalizedLogoUrl;
            university.IsActive = dto.IsActive;

            _unitOfWork.UniversityRepo.UpdateUniversity(university);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<AdminUniversityDto>(university);
        }

        public async Task DeleteUniversity(int id)
        {
            var university = await GetUniversityOrThrow(id);

            university.IsActive = false;

            _unitOfWork.UniversityRepo.UpdateUniversity(university);
            await _unitOfWork.SaveChangesAsync();
        }

        private async Task<University> GetUniversityOrThrow(int id)
        {
            var university = await _unitOfWork.UniversityRepo.GetById(id);
            if (university == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "University not found");
            }

            return university;
        }

        private async Task EnsureNameAvailable(string name, int? universityId = null)
        {
            var existingUniversity = await _unitOfWork.UniversityRepo.GetByName(name);
            if (existingUniversity != null && existingUniversity.UniversityId != universityId)
            {
                throw new AppHttpException(StatusCodes.Status409Conflict, "University name already exists");
            }
        }

        private static string NormalizeName(string name)
        {
            return name.Trim();
        }

        private static string? NormalizeLogoUrl(string? logoUrl)
        {
            if (string.IsNullOrWhiteSpace(logoUrl))
            {
                return null;
            }

            return logoUrl.Trim();
        }
    }
}
