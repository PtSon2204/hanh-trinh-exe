using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IStoreProductRepository
    {
        Task<PagedResult<StoreProduct>> GetStoreProducts(StoreProductQuery query);

        Task<StoreProduct?> GetById(int id);

        Task<StoreProduct?> GetStoreProductByName(string name);

        Task CreateStoreProduct(StoreProduct storeProduct);

        void UpdateStoreProduct(StoreProduct storeProduct);

        void DeleteStoreProduct(StoreProduct storeProduct);
    }
}
