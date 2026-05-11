using AutoMapper;
using TheALMAProject.Application.DTOs.ProductDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Services
{
    /// <summary>
    /// Service cho Customer xem sản phẩm (UC-08 & UC-09)
    /// Luôn filter IsActive = true — chỉ hiện SP đang hoạt động
    /// </summary>
    public class ProductService : IProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ProductService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        /// <summary>
        /// UC-08: Danh sách SP + lọc + sắp xếp + phân trang
        /// </summary>
        public async Task<PagedResult<ProductListItemDto>> GetProductsAsync(StoreProductQuery query)
        {
            // Customer chỉ thấy SP đang active
            query.IsActive = true;

            var result = await _unitOfWork.StoreProductRepo.GetStoreProducts(query);

            var items = result.Data.Select(p => new ProductListItemDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsCustomizable = p.IsCustomizable,
                Category = p.BaseProduct?.Category,
                Material = p.BaseProduct?.Material,
                UniversityName = p.University?.Name,
                AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                ReviewCount = p.Reviews.Count
            }).ToList();

            return new PagedResult<ProductListItemDto>
            {
                Data = items,
                PageNumber = result.PageNumber,
                PageSize = result.PageSize,
                TotalRecords = result.TotalRecords,
                TotalPages = result.TotalPages
            };
        }

        /// <summary>
        /// UC-09: Chi tiết SP — gallery ảnh, thông số, bảng size, màu, đánh giá
        /// </summary>
        public async Task<ProductDetailDto?> GetProductDetailAsync(int id)
        {
            var product = await _unitOfWork.StoreProductRepo.GetProductDetailById(id);

            if (product == null || !product.IsActive)
                return null;

            return new ProductDetailDto
            {
                ProductId = product.ProductId,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                ImageUrl = product.ImageUrl,
                IsCustomizable = product.IsCustomizable,

                // Gallery ảnh từ BaseProduct
                FrontImageUrl = product.BaseProduct?.FrontImageUrl,
                BackImageUrl = product.BaseProduct?.BackImageUrl,

                // Thông số từ BaseProduct
                Category = product.BaseProduct?.Category,
                Material = product.BaseProduct?.Material,
                BasePrice = product.BaseProduct?.BasePrice,

                // Bảng size & màu — parse từ chuỗi CSV
                AvailableSizes = ParseCsv(product.BaseProduct?.AvailableSizes),
                AvailableColors = ParseCsv(product.BaseProduct?.AvailableColors),

                // University
                UniversityId = product.UniversityId,
                UniversityName = product.University?.Name,
                UniversityLogoUrl = product.University?.LogoUrl,

                // Đánh giá tổng hợp
                AverageRating = product.Reviews.Any()
                    ? Math.Round(product.Reviews.Average(r => r.Rating), 1)
                    : 0,
                ReviewCount = product.Reviews.Count,

                // Danh sách reviews chi tiết
                Reviews = product.Reviews
                    .OrderByDescending(r => r.CreatedAt)
                    .Select(r => new ProductReviewDto
                    {
                        ReviewId = r.ReviewId,
                        UserName = r.User?.FullName ?? "Ẩn danh",
                        UserAvatar = r.User?.AvatarUrl,
                        Rating = r.Rating,
                        Comment = r.Comment,
                        CreatedAt = r.CreatedAt
                    }).ToList()
            };
        }

        /// <summary>
        /// UC-09: Sản phẩm liên quan (cùng BaseProduct hoặc University)
        /// </summary>
        public async Task<List<ProductListItemDto>> GetRelatedProductsAsync(int productId, int count = 4)
        {
            var relatedProducts = await _unitOfWork.StoreProductRepo.GetRelatedProducts(productId, count);

            return relatedProducts.Select(p => new ProductListItemDto
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                IsCustomizable = p.IsCustomizable,
                Category = p.BaseProduct?.Category,
                Material = p.BaseProduct?.Material,
                UniversityName = p.University?.Name,
                AverageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => r.Rating), 1) : 0,
                ReviewCount = p.Reviews.Count
            }).ToList();
        }

        /// <summary>
        /// Parse chuỗi CSV (ví dụ: "S,M,L,XL") thành List<string>
        /// </summary>
        private static List<string> ParseCsv(string? csv)
        {
            if (string.IsNullOrWhiteSpace(csv))
                return new List<string>();

            return csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();
        }
    }
}
