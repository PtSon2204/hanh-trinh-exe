using AutoMapper;
using TheALMAProject.Application.DTOs.StoreProductDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class AdminStoreProductService : IAdminStoreProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AdminStoreProductService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<PagedResult<StoreProductListDto>> GetStoreProducts(StoreProductQuery query)
        {
            var result = await _unitOfWork.StoreProductRepo.GetStoreProducts(query);

            return new PagedResult<StoreProductListDto>
            {
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages,
                Data = _mapper.Map<IEnumerable<StoreProductListDto>>(result.Data)
            };
        }

        public async Task<StoreProductDto?> GetStoreProductById(int id)
        {
            var product = await _unitOfWork.StoreProductRepo.GetById(id);

            return _mapper.Map<StoreProductDto>(product);
        }

        public async Task CreateStoreProduct(CreateStoreProductDto dto)
        {
            var existingProduct = await _unitOfWork.StoreProductRepo.GetStoreProductByName(dto.Name);
            if (existingProduct != null)
            {
                throw new Exception("Product already exists");
            }

            var newProduct = _mapper.Map<StoreProduct>(dto);

            await _unitOfWork.StoreProductRepo.CreateStoreProduct(newProduct);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateStoreProduct(int id, UpdateStoreProductDto dto)
        {
            var product = await _unitOfWork.StoreProductRepo.GetById(id);

            if (product == null)
            {
                throw new Exception("Store Product not found");
            }

            product.Name = dto.Name;
            product.Description = dto.Description;
            product.Price = dto.Price;
            product.ImageUrl = dto.ImageUrl;
            product.IsActive = dto.IsActive;
            product.IsCustomizable = dto.IsCustomizable;

            _unitOfWork.StoreProductRepo.UpdateStoreProduct(product);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task DeleteStoreProduct(int id)
        {
            var product = await _unitOfWork.StoreProductRepo.GetById(id);

            if (product == null)
            {
                throw new Exception("Store Product not found");
            }

            _unitOfWork.StoreProductRepo.DeleteStoreProduct(product);
            await _unitOfWork.SaveChangesAsync();
        }
    }
}
