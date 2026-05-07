using FluentValidation;
using TheALMAProject.Application.DTOs.AuthDtos;

namespace TheALMAProject.Application.Validator.AuthValidators
{
    public class ResetPasswordDtoValidator : AbstractValidator<ResetPasswordDto>
    {
        public ResetPasswordDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không đúng định dạng");

            RuleFor(x => x.ResetToken)
                .NotEmpty().WithMessage("Token không được để trống");

            RuleFor(x => x.NewPassword)
                .NotEmpty().WithMessage("Mật khẩu mới không được để trống")
                .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự")
                .MaximumLength(50).WithMessage("Mật khẩu mới tối đa 50 ký tự")
                .Matches("[A-Z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ in hoa")
                .Matches("[a-z]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ thường")
                .Matches("[0-9]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số")
                .Matches("[^a-zA-Z0-9]").WithMessage("Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt");
        }
    }
}
