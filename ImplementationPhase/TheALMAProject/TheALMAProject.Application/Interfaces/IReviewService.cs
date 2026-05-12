using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.ReviewDtos;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Application.Interfaces
{
    public interface IReviewService
    {
        Task<PagedResult<ReviewResponseDto>> GetReviewsAsync(int productId, PaginationParams queryParams);
        Task<bool> CreateReviewAsync(int userId, CreateReviewRequestDto request);
    }
}
