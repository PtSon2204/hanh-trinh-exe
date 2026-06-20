using TheALMAProject.Application.DTOs.CartDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class CartService : ICartService
    {
        private readonly IUnitOfWork _unitOfWork;
        public CartService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        // ─── Lấy giỏ hàng của user ──────────────────────────────────────────────
        public async Task<CartResponseDto?> GetMyCartAsync(int userId)
        {
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdWithDetailsAsync(userId);

            if (cart == null)
            {
                // User chưa có giỏ hàng → trả về giỏ trống
                return new CartResponseDto
                {
                    CartId = 0,
                    UserId = userId,
                    Items = new List<CartItemResponseDto>()
                };
            }

            var dto = new CartResponseDto
            {
                CartId = cart.CartId,
                UserId = cart.UserId,
                Items = cart.CartItems.Select(item =>
                {
                    string productName = "Sản phẩm không xác định";
                    string? imageUrl = null;

                    if (item.Product != null)
                    {
                        productName = item.Product.Name;
                        imageUrl = item.Product.ImageUrl;
                    }
                    else if (item.Design != null)
                    {
                        productName = item.Design.DesignName ?? "Thiết kế của tôi";
                        imageUrl = item.Design.PreviewImageUrl;
                    }

                    return new CartItemResponseDto
                    {
                        CartItemId = item.CartItemId,
                        ProductId = item.ProductId,
                        DesignId = item.DesignId,
                        ProductName = productName,
                        ImageUrl = imageUrl,
                        Size = item.Size,
                        RequiresSize = item.DesignId.HasValue || item.Product?.BaseProductId != null,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice
                    };
                }).ToList()
            };

            return dto;
        }

        // ─── Thêm vào giỏ hàng ──────────────────────────────────────────────────
        public async Task<bool> AddToCartAsync(int userId, AddToCartDto request)
        {
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);
            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                await _unitOfWork.CartRepo.AddCartAsync(cart);
                await _unitOfWork.SaveChangesAsync();
            }

            decimal unitPrice = 0;

            if (request.ProductId.HasValue)
            {
                var product = await _unitOfWork.StoreProductRepo.GetById(request.ProductId.Value);
                if (product == null) return false;
                unitPrice = product.Price;
            }
            else if (request.DesignId.HasValue)
            {
                var userDesign = await _unitOfWork.UserDesignRepo.GetByIdWithDetailsAsync(request.DesignId.Value);
                if (userDesign == null) return false;

                var baseProduct = await _unitOfWork.BaseProductRepo.GetById(userDesign.BaseProductId);
                if (baseProduct == null) return false;

                decimal totalIconPrice = 0;
                if (userDesign.Icons != null && userDesign.Icons.Any())
                {
                    totalIconPrice = userDesign.Icons.Sum(icon => icon.PriceAddon);
                }
                unitPrice = baseProduct.BasePrice + totalIconPrice;
            }
            else
            {
                return false;
            }

            var existingItem = cart.CartItems.FirstOrDefault(i =>
                               i.ProductId == request.ProductId &&
                               i.DesignId == request.DesignId &&
                               i.Size == request.Size);

            if (existingItem != null)
            {
                existingItem.Quantity += request.Quantity;
                _unitOfWork.CartRepo.UpdateCartItemAsync(existingItem);
            }
            else
            {
                var newItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = request.ProductId,
                    DesignId = request.DesignId,
                    Size = request.Size,
                    Quantity = request.Quantity,
                    UnitPrice = unitPrice
                };
                await _unitOfWork.CartRepo.AddCartItemAsync(newItem);
            }

            return await _unitOfWork.SaveChangesAsync() > 0;
        }

        // ─── Cập nhật số lượng / size ────────────────────────────────────────────
        public async Task<bool> UpdateCartItemAsync(int userId, int cartItemId, UpdateCartItemDto dto)
        {
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);
            if (cart == null) return false;

            var item = await _unitOfWork.CartRepo.GetCartItemByIdAsync(cartItemId);
            if (item == null || item.CartId != cart.CartId) return false;

            item.Quantity = dto.Quantity;
            item.Size = dto.Size;
            _unitOfWork.CartRepo.UpdateCartItemAsync(item);

            return await _unitOfWork.SaveChangesAsync() > 0;
        }

        // ─── Xóa item khỏi giỏ hàng ─────────────────────────────────────────────
        public async Task<bool> RemoveCartItemAsync(int userId, int cartItemId)
        {
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);
            if (cart == null) return false;

            var item = await _unitOfWork.CartRepo.GetCartItemByIdAsync(cartItemId);
            if (item == null || item.CartId != cart.CartId) return false;

            _unitOfWork.CartRepo.DeleteCartItemAsync(item);

            return await _unitOfWork.SaveChangesAsync() > 0;
        }

        // ─── Thêm nhiều size cùng lúc (cho 1 design) ─────────────────────────────
        public async Task<bool> AddMultiSizeAsync(int userId, AddDesignMultiSizeDto dto)
        {
            // Chỉ lấy các dòng có số lượng > 0
            var validItems = dto.Items.Where(i => i.Quantity > 0).ToList();
            if (!validItems.Any()) return false;

            // Lấy design để tính giá
            var design = await _unitOfWork.UserDesignRepo.GetByIdWithDetailsAsync(dto.DesignId);
            if (design == null) return false;

            var baseProduct = await _unitOfWork.BaseProductRepo.GetById(design.BaseProductId);
            if (baseProduct == null) return false;

            decimal totalIconPrice = design.Icons != null && design.Icons.Any()
                ? design.Icons.Sum(icon => icon.PriceAddon)
                : 0;

            decimal unitPrice = baseProduct.BasePrice + totalIconPrice;

            // Lấy hoặc tạo Cart
            var cart = await _unitOfWork.CartRepo.GetCartByUserIdAsync(userId);
            if (cart == null)
            {
                cart = new Cart { UserId = userId };
                await _unitOfWork.CartRepo.AddCartAsync(cart);
                await _unitOfWork.SaveChangesAsync();
            }

            // Thêm từng size
            foreach (var sizeItem in validItems)
            {
                var existing = cart.CartItems.FirstOrDefault(ci =>
                    ci.DesignId == dto.DesignId && ci.Size == sizeItem.Size);

                if (existing != null)
                {
                    existing.Quantity += sizeItem.Quantity;
                    _unitOfWork.CartRepo.UpdateCartItemAsync(existing);
                }
                else
                {
                    await _unitOfWork.CartRepo.AddCartItemAsync(new CartItem
                    {
                        CartId = cart.CartId,
                        DesignId = dto.DesignId,
                        Size = sizeItem.Size,
                        Quantity = sizeItem.Quantity,
                        UnitPrice = unitPrice
                    });
                }
            }

            return await _unitOfWork.SaveChangesAsync() > 0;
        }
    }
}
