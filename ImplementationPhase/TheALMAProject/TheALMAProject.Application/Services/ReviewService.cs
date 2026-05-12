using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using TheALMAProject.Application.DTOs.ReviewDtos;
using TheALMAProject.Application.Interfaces;
using TheALMAProject.Domain.Common;
using TheALMAProject.Domain.Interfaces;
using TheALMAProject.Infrastructure.Models;

namespace TheALMAProject.Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public ReviewService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<PagedResult<ReviewResponseDto>> GetReviewsAsync(int productId, PaginationParams queryParams)
        {
            var pagedReviews = await _unitOfWork.ReviewRepo.GetReviewsByProductIdAsync(productId, queryParams);

            var dtoList = _mapper.Map<List<ReviewResponseDto>>(pagedReviews.Data);

            return new PagedResult<ReviewResponseDto>
            {
                Data = dtoList,
                PageNumber = pagedReviews.PageNumber,
                PageSize = pagedReviews.PageSize,
                TotalRecords = pagedReviews.TotalRecords,
                TotalPages = pagedReviews.TotalPages
            };
        }

        // Tạo Review mới (Chỉ áp dụng cho khách đã mua)
        public async Task<bool> CreateReviewAsync(int userId, CreateReviewRequestDto request)
        {
            bool isValidPurchase = await _unitOfWork.OrderRepo
                .IsProductPurchasedAndCompletedAsync(userId, request.ProductId, request.OrderId);

            if (!isValidPurchase) return false;

            bool hasReviewed = await _unitOfWork.ReviewRepo
                .HasReviewedAsync(userId, request.ProductId, request.OrderId);

            if (hasReviewed) return false;

            var newReview = new Review
            {
                UserId = userId,
                ProductId = request.ProductId,
                OrderId = request.OrderId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = DateTime.Now
            };

            await _unitOfWork.ReviewRepo.AddReviewAsync(newReview);
            return await _unitOfWork.SaveChangesAsync() > 0;
        }
    }
}
