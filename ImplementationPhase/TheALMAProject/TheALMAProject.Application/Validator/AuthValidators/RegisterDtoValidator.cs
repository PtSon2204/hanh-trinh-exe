using FluentValidation;
using TheALMAProject.Application.DTOs.AuthDtos;

namespace TheALMAProject.Application.Validator.AuthValidators
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không đúng định dạng")
                .MaximumLength(255).WithMessage("Email tối đa 255 ký tự");

            RuleFor(x => x.Password)
                .NotEmpty().WithMessage("Mật khẩu không được để trống")
                .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
                .MaximumLength(50).WithMessage("Mật khẩu tối đa 50 ký tự")
                .Matches("[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ in hoa")
                .Matches("[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường")
                .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số")
                .Matches("[^a-zA-Z0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Họ tên không được để trống")
                .MaximumLength(255).WithMessage("Họ tên tối đa 255 ký tự");

            RuleFor(x => x.Phone)
                .MaximumLength(20).WithMessage("Số điện thoại tối đa 20 ký tự")
                .Matches(@"^[0-9]*$").WithMessage("Số điện thoại chỉ chứa chữ số")
                .When(x => !string.IsNullOrEmpty(x.Phone));
        }
    }
}
