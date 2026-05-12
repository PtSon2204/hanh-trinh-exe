using FluentValidation;
using TheALMAProject.Application.DTOs.IconDtos;

namespace TheALMAProject.Application.Validator.IconValidators
{
    public class UpdateIconDtoValidator : AbstractValidator<UpdateIconDto>
    {
        public UpdateIconDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên icon không được để trống")
                .MaximumLength(255).WithMessage("Tên icon tối đa 255 ký tự");

            RuleFor(x => x.Category)
                .NotEmpty().WithMessage("Loại icon không được để trống")
                .MaximumLength(50).WithMessage("Loại icon tối đa 50 ký tự");

            RuleFor(x => x.PriceAddon)
                .GreaterThanOrEqualTo(0).WithMessage("Giá cộng thêm không được âm");
        }
    }
}
