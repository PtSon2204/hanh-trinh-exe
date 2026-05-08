using TheALMAProject.Application.DTOs.StoreProductDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    public interface IAdminStoreProductService
    {
        Task<PagedResult<StoreProductListDto>> GetStoreProducts(StoreProductQuery query);

        Task<StoreProductDto?> GetStoreProductById(int id);

        Task CreateStoreProduct(CreateStoreProductDto storeProduct);

        Task UpdateStoreProduct(int id, UpdateStoreProductDto storeProduct);

        Task DeleteStoreProduct(int id);
    }
}
