using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FluentValidation;
using TheALMAProject.Application.DTOs.ReviewDtos;
using TheALMAProject.Application.DTOs.StoreProductDtos;

namespace TheALMAProject.Application.Validator.ReviewValidators
{
    public class CreateReviewDtoValidator : AbstractValidator<CreateReviewRequestDto>
    {
        public CreateReviewDtoValidator()
        {
            // Validate Rating (từ 1 sao đến 5 sao)
            RuleFor(x => x.Rating)
                .NotEmpty().WithMessage("Vui lòng đánh giá số sao.")
                .InclusiveBetween(1, 5).WithMessage("Đánh giá phải nằm trong khoảng từ 1 đến 5 sao.");

            // Validate Comment (Cho phép null, nhưng nếu có nhập thì tối đa 500 ký tự)
            RuleFor(x => x.Comment)
                .MaximumLength(500).WithMessage("Bình luận của bạn quá dài, vui lòng rút gọn dưới 500 ký tự.")
                .When(x => !string.IsNullOrWhiteSpace(x.Comment)); // Chỉ chạy rule này nếu Comment không rỗng
        }
    }
}
