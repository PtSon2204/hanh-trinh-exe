using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Data;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Infrastructure.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly  ApplicationDbContext _context;

        public CartRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddCartAsync(Cart cart)
        {
            await _context.Carts.AddAsync(cart);
        }

        public async Task AddCartItemAsync(CartItem cartItem)
        {
            await _context.CartItems.AddAsync(cartItem);
        }

        public void DeleteCartItemAsync(CartItem cartItem)
        {
             _context.CartItems.Remove(cartItem);
        }

        public async Task<Cart?> GetCartByUserIdAsync(int userId)
        {
            return await _context.Carts
                         .Include(c => c.CartItems)
                         .FirstOrDefaultAsync(c => c.UserId == userId);
        }

        public void UpdateCartItemAsync(CartItem cartItem)
        {
            _context.CartItems.Update(cartItem);
        }
    }
}
