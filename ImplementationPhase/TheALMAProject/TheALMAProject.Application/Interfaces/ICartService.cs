using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.CartDtos;

namespace TheALMAProject.Application.Interfaces
{
    public interface ICartService
    {
        Task<bool> AddToCartAsync(int userId, AddToCartDto request);
        Task<bool> AddMultiSizeAsync(int userId, AddDesignMultiSizeDto dto);
        Task<CartResponseDto?> GetMyCartAsync(int userId);
        Task<bool> UpdateCartItemAsync(int userId, int cartItemId, UpdateCartItemDto dto);
        Task<bool> RemoveCartItemAsync(int userId, int cartItemId);
    }
}
