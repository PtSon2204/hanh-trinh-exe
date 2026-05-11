using TheALMAProject.Application.DTOs.ProductDtos;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Interfaces
{
    /// <summary>
    /// Service cho Customer xem sản phẩm (UC-08 & UC-09)
    /// Tách biệt khỏi IAdminStoreProductService (Admin CRUD)
    /// </summary>
    public interface IProductService
    {
        /// <summary>
        /// UC-08: Danh sách SP + lọc + sắp xếp + phân trang
        /// </summary>
        Task<PagedResult<ProductListItemDto>> GetProductsAsync(StoreProductQuery query);

        /// <summary>
        /// UC-09: Chi tiết SP (gallery, size, màu, reviews, thông số)
        /// </summary>
        Task<ProductDetailDto?> GetProductDetailAsync(int id);

        /// <summary>
        /// UC-09: Sản phẩm liên quan
        /// </summary>
        Task<List<ProductListItemDto>> GetRelatedProductsAsync(int productId, int count = 4);
    }
}
