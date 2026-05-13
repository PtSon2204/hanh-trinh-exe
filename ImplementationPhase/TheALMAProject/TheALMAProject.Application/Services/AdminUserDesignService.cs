using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.AdminUserDesignDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;

namespace TheALMAProject.Application.Services
{
    public class AdminUserDesignService : IAdminUserDesignService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminUserDesignService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<AdminUserDesignListDto>> GetUserDesigns(PaginationParams paginationParams)
        {
            var result = await _unitOfWork.UserDesignRepo.GetAllAsync(paginationParams);

            return new PagedResult<AdminUserDesignListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<AdminUserDesignListDto>>(result.Data)
            };
        }

        public async Task<AdminUserDesignDto?> GetUserDesignById(int id)
        {
            var design = await _unitOfWork.UserDesignRepo.GetByIdWithAdminDetailsAsync(id);
            return _mapper.Map<AdminUserDesignDto>(design);
        }

        public async Task DeleteUserDesign(int id)
        {
            var design = await _unitOfWork.UserDesignRepo.GetByIdWithAdminDetailsAsync(id);
            if (design == null)
            {
                throw new AppHttpException(StatusCodes.Status404NotFound, "User design not found");
            }

            _unitOfWork.UserDesignRepo.Delete(design);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
