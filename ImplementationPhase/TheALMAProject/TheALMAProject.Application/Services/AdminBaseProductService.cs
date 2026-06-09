using AutoMapper;
using TheALMAProject.Application.DTOs.BaseProductDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class AdminBaseProductService : IAdminBaseProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminBaseProductService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<BaseProductListDto>> GetBaseProducts(BaseProductQuery query)
        {
            var result = await _unitOfWork.BaseProductRepo.GetBaseProducts(query);

            return new PagedResult<BaseProductListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<BaseProductListDto>>(result.Data)
            };
        }

        public async Task<BaseProductDto?> GetBaseProductById(int id)
        {
            var baseProduct = await _unitOfWork.BaseProductRepo.GetById(id);

            return _mapper.Map<BaseProductDto>(baseProduct);
        }

        public async Task CreateBaseProduct(CreateBaseProductDto dto)
        {
            var existingBaseProduct = await _unitOfWork.BaseProductRepo.GetBaseProductByName(dto.Name);
            if (existingBaseProduct != null)
            {
                throw new Exception("Base product already exists");
            }

            var newBaseProduct = _mapper.Map<BaseProduct>(dto);
            if (dto.ThreeDConfig != null)
            {
                newBaseProduct.ThreeDConfig = _mapper.Map<BaseProduct3DConfig>(dto.ThreeDConfig);
            }

            await _unitOfWork.BaseProductRepo.CreateBaseProduct(newBaseProduct);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateBaseProduct(int id, UpdateBaseProductDto dto)
        {
            var baseProduct = await _unitOfWork.BaseProductRepo.GetById(id);

            if (baseProduct == null)
            {
                throw new Exception("Base Product not found");
            }

            var duplicateProduct = await _unitOfWork.BaseProductRepo.GetBaseProductByName(dto.Name);
            if (duplicateProduct != null && duplicateProduct.BaseProductId != id)
            {
                throw new Exception("Base product already exists");
            }

            baseProduct.Name = dto.Name;
            baseProduct.BasePrice = dto.BasePrice;
            baseProduct.FrontImageUrl = dto.FrontImageUrl;
            baseProduct.BackImageUrl = dto.BackImageUrl;
            baseProduct.PrintAreaJson = dto.PrintAreaJson;
            baseProduct.Category = dto.Category;
            baseProduct.Material = dto.Material;
            baseProduct.AvailableColors = dto.AvailableColors;
            baseProduct.AvailableSizes = dto.AvailableSizes;
            baseProduct.IsActive = dto.IsActive;

            if (dto.ThreeDConfig == null)
            {
                baseProduct.ThreeDConfig = null;
            }
            else if (baseProduct.ThreeDConfig == null)
            {
                baseProduct.ThreeDConfig = _mapper.Map<BaseProduct3DConfig>(dto.ThreeDConfig);
            }
            else
            {
                baseProduct.ThreeDConfig.ModelUrl = dto.ThreeDConfig.ModelUrl;
                baseProduct.ThreeDConfig.CenterOffsetJson = dto.ThreeDConfig.CenterOffsetJson;
                baseProduct.ThreeDConfig.FrontPrintPlaneJson = dto.ThreeDConfig.FrontPrintPlaneJson;
                baseProduct.ThreeDConfig.BackPrintPlaneJson = dto.ThreeDConfig.BackPrintPlaneJson;
            }

            _unitOfWork.BaseProductRepo.UpdateBaseProduct(baseProduct);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteBaseProduct(int id)
        {
            var baseProduct = await _unitOfWork.BaseProductRepo.GetById(id);

            if (baseProduct == null)
            {
                throw new Exception("Base Product not found");
            }

            _unitOfWork.BaseProductRepo.DeleteBaseProduct(baseProduct);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
