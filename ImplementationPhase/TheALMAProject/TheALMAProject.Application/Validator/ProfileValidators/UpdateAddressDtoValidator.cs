using FluentValidation;
using TheALMAProject.Application.DTOs.ProfileDtos;

namespace TheALMAProject.Application.Validator.ProfileValidators
{
    /// <summary>
    /// UC-22: Validate cập nhật địa chỉ
    /// </summary>
    public class UpdateAddressDtoValidator : AbstractValidator<UpdateAddressDto>
    {
        public UpdateAddressDtoValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Tên người nhận không được để trống.")
                .MaximumLength(255).WithMessage("Tên người nhận tối đa 255 ký tự.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Số điện thoại không được để trống.")
                .Matches(@"^(0[0-9]{9})$").WithMessage("Số điện thoại không hợp lệ (phải bắt đầu bằng 0, đúng 10 chữ số).");

            RuleFor(x => x.AddressLine)
                .NotEmpty().WithMessage("Địa chỉ chi tiết không được để trống.")
                .MaximumLength(500).WithMessage("Địa chỉ chi tiết tối đa 500 ký tự.");

            RuleFor(x => x.Province)
                .NotEmpty().WithMessage("Tỉnh/Thành phố không được để trống.")
                .MaximumLength(100).WithMessage("Tỉnh/Thành phố tối đa 100 ký tự.");

            RuleFor(x => x.District)
                .NotEmpty().WithMessage("Quận/Huyện không được để trống.")
                .MaximumLength(100).WithMessage("Quận/Huyện tối đa 100 ký tự.");
        }
    }
}
