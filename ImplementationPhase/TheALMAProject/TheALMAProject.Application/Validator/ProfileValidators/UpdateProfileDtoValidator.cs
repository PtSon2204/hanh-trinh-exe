using FluentValidation;
using TheALMAProject.Application.DTOs.ProfileDtos;

namespace TheALMAProject.Application.Validator.ProfileValidators
{
    /// <summary>
    /// UC-22: Validate cập nhật profile (tên, SĐT)
    /// </summary>
    public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileDtoValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Họ tên không được để trống.")
                .MaximumLength(255).WithMessage("Họ tên tối đa 255 ký tự.");

            RuleFor(x => x.Phone)
                .Matches(@"^(0[0-9]{9})$").WithMessage("Số điện thoại không hợp lệ (phải bắt đầu bằng 0, đúng 10 chữ số).")
                .When(x => !string.IsNullOrWhiteSpace(x.Phone));
        }
    }
}
