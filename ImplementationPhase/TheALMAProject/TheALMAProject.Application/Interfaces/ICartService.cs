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
    }
}
