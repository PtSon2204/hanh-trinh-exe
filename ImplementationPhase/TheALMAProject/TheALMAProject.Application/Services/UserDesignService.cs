using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.UserDesignDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Services
{
    public class UserDesignService : IUserDesignService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public UserDesignService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<UserDesignResponseDto>> GetMyDesignsAsync(int userId, UserDesignQuery query)
        {
            var result = await _unitOfWork.UserDesignRepo.GetMyDesignsAsync(userId, query);
            var dtoList = _mapper.Map<List<UserDesignResponseDto>>(result.Data);

            return new PagedResult<UserDesignResponseDto>
            {
                Data = dtoList,
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages
            };
        }

        public async Task<string> DeleteDesignAsync(int userId, int designId)
        {
            var design = await _unitOfWork.UserDesignRepo.GetByIdForOwnerAsync(designId, userId);
            if (design == null) return "Không tìm thấy bản thiết kế.";

            if (design.IsOrdered)
                return "Không thể xóa bản thiết kế đã được sử dụng để đặt hàng."; 
            _unitOfWork.UserDesignRepo.Delete(design);
            await _unitOfWork.SaveChangesAsync();
            return "Thành công";
        }

        public async Task<UserDesignResponseDto?> GetSharedDesignAsync(int designId)
        {
            var design = await _unitOfWork.UserDesignRepo.GetSharedDesignByIdAsync(designId);
            return design == null ? null : _mapper.Map<UserDesignResponseDto>(design);
        }

        public async Task<bool> UpdateDesignAsync(int userId, int designId, UpdateUserDesignDto dto)
        {
            var design = await _unitOfWork.UserDesignRepo.GetByIdForUpdateAsync(designId, userId);
            if (design == null || design.IsOrdered) return false; 

            if (!string.IsNullOrEmpty(dto.DesignName)) design.DesignName = dto.DesignName;
            if (dto.BaseProductId.HasValue) design.BaseProductId = dto.BaseProductId.Value;
            if (!string.IsNullOrEmpty(dto.CanvasJson)) design.CanvasJson = dto.CanvasJson;
            if (!string.IsNullOrEmpty(dto.PreviewImageUrl)) design.PreviewImageUrl = dto.PreviewImageUrl;

            design.Icons.Clear();
            if (dto.IconIds.Any())
            {
                foreach (var id in dto.IconIds)
                {
                    var icon = await _unitOfWork.IconRepo.GetById(id); 
                    if (icon != null) design.Icons.Add(icon);
                }
            }

            design.Fonts.Clear();
            if (dto.FontIds.Any())
            {
                foreach (var id in dto.FontIds)
                {
                   var font = await _unitOfWork.FontRepo.GetByIdAsync(id);
                   if (font != null) design.Fonts.Add(font);
                }
            }

            return await _unitOfWork.SaveChangesAsync() > 0;
        }
    }
}
