using AutoMapper;
using TheALMAProject.Application.DTOs.IconDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Application.Services
{
    public class AdminIconService : IAdminIconService
    {
        private const string IconFolder = "images/icons";

        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public AdminIconService(IUnitOfWork unitOfWork, IMapper mapper, IFileStorageService fileStorageService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _fileStorageService = fileStorageService;
        }

        public async Task<PagedResult<IconListDto>> GetIcons(IconQuery query)
        {
            var result = await _unitOfWork.IconRepo.GetIcons(query);

            return new PagedResult<IconListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<IconListDto>>(result.Data)
            };
        }

        public async Task<IconDto?> GetIconById(int id)
        {
            var icon = await _unitOfWork.IconRepo.GetById(id);

            return _mapper.Map<IconDto>(icon);
        }

        public async Task CreateIcon(CreateIconDto dto)
        {
            var existingIcon = await _unitOfWork.IconRepo.GetIconByName(dto.Name);
            if (existingIcon != null)
            {
                throw new Exception("Icon already exists");
            }

            if (dto.ImageFile == null)
            {
                throw new Exception("Icon image is required");
            }

            var imageUrl = await _fileStorageService.SaveFileAsync(dto.ImageFile, IconFolder);
            var newIcon = _mapper.Map<Icon>(dto);
            newIcon.ImageUrl = imageUrl;

            await _unitOfWork.IconRepo.CreateIcon(newIcon);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateIcon(int id, UpdateIconDto dto)
        {
            var icon = await _unitOfWork.IconRepo.GetById(id);
            if (icon == null)
            {
                throw new Exception("Icon not found");
            }

            var duplicateIcon = await _unitOfWork.IconRepo.GetIconByName(dto.Name);
            if (duplicateIcon != null && duplicateIcon.IconId != id)
            {
                throw new Exception("Icon already exists");
            }

            var oldImageUrl = icon.ImageUrl;

            icon.Name = dto.Name;
            icon.PriceAddon = dto.PriceAddon;
            icon.Category = dto.Category;
            icon.IsActive = dto.IsActive;

            if (dto.ImageFile != null)
            {
                icon.ImageUrl = await _fileStorageService.SaveFileAsync(dto.ImageFile, IconFolder);
            }

            _unitOfWork.IconRepo.UpdateIcon(icon);
            await _unitOfWork.SaveChangesAsync();

            if (dto.ImageFile != null)
            {
                await _fileStorageService.DeleteFileAsync(oldImageUrl);
            }
        }

        public async Task DeleteIcon(int id)
        {
            var icon = await _unitOfWork.IconRepo.GetById(id);
            if (icon == null)
            {
                throw new Exception("Icon not found");
            }

            var imageUrl = icon.ImageUrl;
            _unitOfWork.IconRepo.DeleteIcon(icon);
            await _unitOfWork.SaveChangesAsync();
            await _fileStorageService.DeleteFileAsync(imageUrl);
        }
    }
}
