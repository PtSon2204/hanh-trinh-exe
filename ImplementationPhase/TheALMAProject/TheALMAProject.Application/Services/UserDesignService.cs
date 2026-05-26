using AutoMapper;
using Microsoft.AspNetCore.Http;
using TheALMAProject.Application.DTOs.UserDesignDtos;
using TheALMAProject.Application.Exceptions;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;
using TheALMAProject.Infrastructure.Services;

namespace TheALMAProject.Application.Services
{
    public class UserDesignService : IUserDesignService
    {
        private const string PreviewFolder = "uploads/design-previews";
        private const int MaxPreviewImageBytes = 5 * 1024 * 1024;

        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IFileStorageService _fileStorageService;

        public UserDesignService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IFileStorageService fileStorageService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _fileStorageService = fileStorageService;
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

            var previewImageUrls = new[]
            {
                design.PreviewImageUrl,
                design.FrontPreviewImageUrl,
                design.BackPreviewImageUrl
            };

            _unitOfWork.UserDesignRepo.Delete(design);
            await _unitOfWork.SaveChangesAsync();

            await DeletePreviewUrlsIfNeededAsync(previewImageUrls);

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

            var previousPreviewUrls = Array.Empty<string?>();
            var newStoredPreviewUrls = new List<string?>();

            if (!string.IsNullOrEmpty(dto.DesignName)) design.DesignName = dto.DesignName;
            if (dto.BaseProductId.HasValue) design.BaseProductId = dto.BaseProductId.Value;
            var frontCanvasJson = dto.FrontCanvasJson ?? dto.CanvasJson;
            if (!string.IsNullOrEmpty(frontCanvasJson))
            {
                design.FrontCanvasJson = frontCanvasJson;
                design.CanvasJson = frontCanvasJson;
            }

            if (dto.BackCanvasJson != null)
            {
                design.BackCanvasJson = dto.BackCanvasJson;
            }

            var frontPreviewImageUrl = dto.FrontPreviewImageUrl ?? dto.PreviewImageUrl;
            if (!string.IsNullOrEmpty(frontPreviewImageUrl))
            {
                previousPreviewUrls = previousPreviewUrls
                    .Concat(new[] { design.PreviewImageUrl, design.FrontPreviewImageUrl })
                    .ToArray();
                var savedFrontPreviewImageUrl = await SavePreviewImageIfNeededAsync(frontPreviewImageUrl);
                design.PreviewImageUrl = savedFrontPreviewImageUrl;
                design.FrontPreviewImageUrl = savedFrontPreviewImageUrl;

                if (previousPreviewUrls.All(url => url != savedFrontPreviewImageUrl) && IsStoredPreviewUrl(savedFrontPreviewImageUrl))
                {
                    newStoredPreviewUrls.Add(savedFrontPreviewImageUrl);
                }
            }

            if (!string.IsNullOrEmpty(dto.BackPreviewImageUrl))
            {
                previousPreviewUrls = previousPreviewUrls
                    .Concat(new[] { design.BackPreviewImageUrl })
                    .ToArray();
                design.BackPreviewImageUrl = await SavePreviewImageIfNeededAsync(dto.BackPreviewImageUrl);

                if (previousPreviewUrls.All(url => url != design.BackPreviewImageUrl) && IsStoredPreviewUrl(design.BackPreviewImageUrl))
                {
                    newStoredPreviewUrls.Add(design.BackPreviewImageUrl);
                }
            }

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

            try
            {
                var saved = await _unitOfWork.SaveChangesAsync() > 0;

                if (!saved)
                {
                    await DeletePreviewUrlsIfNeededAsync(newStoredPreviewUrls);
                    return false;
                }

                await DeletePreviewUrlsIfNeededAsync(
                    previousPreviewUrls,
                    design.PreviewImageUrl,
                    design.FrontPreviewImageUrl,
                    design.BackPreviewImageUrl);

                return true;
            }
            catch
            {
                await DeletePreviewUrlsIfNeededAsync(newStoredPreviewUrls);
                throw;
            }
        }

        public async Task<int?> CreateDesignAsync(int userId, CreateUserDesignDto dto)
        {
            var baseProduct = await _unitOfWork.BaseProductRepo.GetById(dto.BaseProductId);
            if (baseProduct == null) return null;

            var frontCanvasJson = dto.FrontCanvasJson ?? dto.CanvasJson;

            var frontPreviewImageUrl = await SavePreviewImageIfNeededAsync(dto.FrontPreviewImageUrl ?? dto.PreviewImageUrl);
            var backPreviewImageUrl = await SavePreviewImageIfNeededAsync(dto.BackPreviewImageUrl);

            var newDesign = new UserDesign
            {
                UserId = userId,
                BaseProductId = dto.BaseProductId,
                CanvasJson = frontCanvasJson,
                FrontCanvasJson = frontCanvasJson,
                BackCanvasJson = dto.BackCanvasJson,
                PreviewImageUrl = frontPreviewImageUrl,
                FrontPreviewImageUrl = frontPreviewImageUrl,
                BackPreviewImageUrl = backPreviewImageUrl,
                PrintFileUrl = dto.PrintFileUrl,
                DesignName = string.IsNullOrWhiteSpace(dto.DesignName) ? "Bản thiết kế mới" : dto.DesignName,
                IsOrdered = false, 
                CreatedAt = DateTime.UtcNow
            };


            if (dto.IconIds != null && dto.IconIds.Any())
            {
                var distinctIconIds = dto.IconIds.Distinct().ToList();
                foreach (var id in distinctIconIds)
                {
                    var icon = await _unitOfWork.IconRepo.GetById(id);
                    if (icon != null)
                    {
                        newDesign.Icons.Add(icon); 
                    }
                }
            }

            if (dto.FontIds != null && dto.FontIds.Any())
            {
                var distinctFontIds = dto.FontIds.Distinct().ToList();
                foreach (var id in distinctFontIds)
                {
                    var font = await _unitOfWork.FontRepo.GetByIdAsync(id);
                    if (font != null)
                    {
                        newDesign.Fonts.Add(font);
                    }
                }
            }

            try
            {
                await _unitOfWork.UserDesignRepo.AddAsync(newDesign);
                var saved = await _unitOfWork.SaveChangesAsync() > 0;
                if (!saved)
                {
                    await DeletePreviewUrlsIfNeededAsync(new[]
                    {
                        newDesign.PreviewImageUrl,
                        newDesign.FrontPreviewImageUrl,
                        newDesign.BackPreviewImageUrl
                    });
                }

                return saved ? newDesign.DesignId : null;
            }
            catch (Exception ex)
            {
                await DeletePreviewUrlsIfNeededAsync(new[]
                {
                    newDesign.PreviewImageUrl,
                    newDesign.FrontPreviewImageUrl,
                    newDesign.BackPreviewImageUrl
                });
                throw new Exception($"Lỗi lưu DB: {ex.Message} | Inner: {ex.InnerException?.Message}");
            }
        }

        private async Task<string?> SavePreviewImageIfNeededAsync(string? previewImageUrl)
        {
            if (string.IsNullOrWhiteSpace(previewImageUrl) || !previewImageUrl.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
            {
                return previewImageUrl;
            }

            var separatorIndex = previewImageUrl.IndexOf(',');
            if (separatorIndex < 0)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image data is invalid");
            }

            var metadata = previewImageUrl[..separatorIndex];
            if (!metadata.EndsWith(";base64", StringComparison.OrdinalIgnoreCase))
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image must be base64 encoded");
            }

            var contentType = metadata["data:".Length..^";base64".Length].ToLowerInvariant();
            var extension = contentType switch
            {
                "image/png" => ".png",
                "image/jpeg" => ".jpg",
                "image/webp" => ".webp",
                "image/gif" => ".gif",
                _ => throw new AppHttpException(StatusCodes.Status400BadRequest, "Unsupported preview image type")
            };

            var base64Data = previewImageUrl[(separatorIndex + 1)..];
            var maximumEncodedLength = ((MaxPreviewImageBytes + 2) / 3) * 4;
            if (base64Data.Length > maximumEncodedLength)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image must be 5MB or smaller");
            }

            byte[] imageBytes;
            try
            {
                imageBytes = Convert.FromBase64String(base64Data);
            }
            catch (FormatException)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image data is invalid");
            }

            if (imageBytes.Length > MaxPreviewImageBytes)
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image must be 5MB or smaller");
            }

            if (!HasExpectedImageSignature(imageBytes, contentType))
            {
                throw new AppHttpException(StatusCodes.Status400BadRequest, "Preview image data is invalid");
            }

            await using var stream = new MemoryStream(imageBytes);
            var file = new FormFile(stream, 0, imageBytes.Length, "preview", $"preview{extension}")
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };

            return await _fileStorageService.SaveFileAsync(file, PreviewFolder);
        }

        private static bool IsStoredPreviewUrl(string? previewImageUrl)
        {
            return previewImageUrl?.StartsWith($"/{PreviewFolder}/", StringComparison.OrdinalIgnoreCase) == true;
        }

        private async Task DeletePreviewUrlsIfNeededAsync(IEnumerable<string?> previewImageUrls, params string?[] retainedPreviewUrls)
        {
            var retainedUrls = retainedPreviewUrls
                .Where(url => !string.IsNullOrWhiteSpace(url))
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            foreach (var previewImageUrl in previewImageUrls.Distinct(StringComparer.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(previewImageUrl)
                    || !IsStoredPreviewUrl(previewImageUrl)
                    || retainedUrls.Contains(previewImageUrl))
                {
                    continue;
                }

                await _fileStorageService.DeleteFileAsync(previewImageUrl);
            }
        }

        private static bool HasExpectedImageSignature(byte[] imageBytes, string contentType)
        {
            return contentType switch
            {
                "image/png" => imageBytes.Length >= 8
                    && imageBytes[0] == 0x89
                    && imageBytes[1] == 0x50
                    && imageBytes[2] == 0x4E
                    && imageBytes[3] == 0x47
                    && imageBytes[4] == 0x0D
                    && imageBytes[5] == 0x0A
                    && imageBytes[6] == 0x1A
                    && imageBytes[7] == 0x0A,
                "image/jpeg" => imageBytes.Length >= 3
                    && imageBytes[0] == 0xFF
                    && imageBytes[1] == 0xD8
                    && imageBytes[2] == 0xFF,
                "image/gif" => imageBytes.Length >= 6
                    && imageBytes[0] == 'G'
                    && imageBytes[1] == 'I'
                    && imageBytes[2] == 'F'
                    && imageBytes[3] == '8'
                    && (imageBytes[4] == '7' || imageBytes[4] == '9')
                    && imageBytes[5] == 'a',
                "image/webp" => imageBytes.Length >= 12
                    && imageBytes[0] == 'R'
                    && imageBytes[1] == 'I'
                    && imageBytes[2] == 'F'
                    && imageBytes[3] == 'F'
                    && imageBytes[8] == 'W'
                    && imageBytes[9] == 'E'
                    && imageBytes[10] == 'B'
                    && imageBytes[11] == 'P',
                _ => false
            };
        }
    }
}
