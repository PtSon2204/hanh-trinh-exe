using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Domain.Interfaces
{
    public interface IReviewRepository
    {
        Task<PagedResult<Review>> GetReviewsByProductIdAsync(int productId, PaginationParams queryParams);
        Task AddReviewAsync(Review review);
        Task<bool> HasReviewedAsync(int userId, int productId, int orderId);
    }
}
