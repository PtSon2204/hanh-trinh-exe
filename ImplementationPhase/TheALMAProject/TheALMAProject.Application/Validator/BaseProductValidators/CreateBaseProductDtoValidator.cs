using FluentValidation;
using TheALMAProject.Application.DTOs.BaseProductDtos;

namespace TheALMAProject.Application.Validator.BaseProductValidators
{
    public class CreateBaseProductDtoValidator : AbstractValidator<CreateBaseProductDto>
    {
        public CreateBaseProductDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên phôi áo không được để trống")
                .MaximumLength(255).WithMessage("Tên phôi áo tối đa 255 ký tự");

            RuleFor(x => x.BasePrice)
                .GreaterThan(0).WithMessage("Giá phôi áo phải lớn hơn 0");

            RuleFor(x => x.Category)
                .NotEmpty().WithMessage("Loại sản phẩm không được để trống")
                .MaximumLength(50).WithMessage("Loại sản phẩm tối đa 50 ký tự");

            RuleFor(x => x.Material)
                .NotEmpty().WithMessage("Chất liệu không được để trống")
                .MaximumLength(255).WithMessage("Chất liệu tối đa 255 ký tự");

            RuleFor(x => x.FrontImageUrl)
                .MaximumLength(500).WithMessage("Ảnh mặt trước tối đa 500 ký tự");

            RuleFor(x => x.BackImageUrl)
                .MaximumLength(500).WithMessage("Ảnh mặt sau tối đa 500 ký tự");

            RuleFor(x => x.AvailableSizes)
                .MaximumLength(255).WithMessage("Danh sách kích cỡ tối đa 255 ký tự");
        }
    }
}
