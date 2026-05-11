using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
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

            if (request.ProductId.HasValue) //sản phẩm có sẵn
            {
                var product = await _unitOfWork.StoreProductRepo.GetById(request.ProductId.Value);
                if (product == null) return false;

                unitPrice = product.Price;
            } 
            else if (request.DesignId.HasValue) //sản phẩm user design
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
    }
}

