using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface ICartRepository
    {
        Task<Cart?> GetCartByUserIdAsync(int userId);
        Task<Cart?> GetCartByUserIdWithDetailsAsync(int userId);
        Task<CartItem?> GetCartItemByIdAsync(int cartItemId);
        Task AddCartAsync(Cart cart);
        Task AddCartItemAsync(CartItem cartItem);
        void UpdateCartItemAsync(CartItem cartItem);
        void DeleteCartItemAsync(CartItem cartItem);
    }
}
