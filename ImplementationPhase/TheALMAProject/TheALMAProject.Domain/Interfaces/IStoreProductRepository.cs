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

        // UC-09: Lấy chi tiết SP kèm BaseProduct, University, Reviews
        Task<StoreProduct?> GetProductDetailById(int id);

        // UC-09: Lấy sản phẩm liên quan (cùng BaseProduct hoặc University)
        Task<List<StoreProduct>> GetRelatedProducts(int productId, int count);

        Task CreateStoreProduct(StoreProduct storeProduct);

        void UpdateStoreProduct(StoreProduct storeProduct);

        void DeleteStoreProduct(StoreProduct storeProduct);

        // UC-10: Tìm kiếm sản phẩm theo từ khoá (AJAX real-time)
        Task<List<StoreProduct>> SearchProductsAsync(string keyword, int maxResults);
    }
}
