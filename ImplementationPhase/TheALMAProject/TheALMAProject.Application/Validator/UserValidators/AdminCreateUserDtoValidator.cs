using FluentValidation;
using TheALMAProject.Application.Constants;
using TheALMAProject.Application.DTOs.AdminUserDtos;

namespace TheALMAProject.Application.Validator.UserValidators
{
    public class AdminCreateUserDtoValidator : AbstractValidator<AdminCreateUserDto>
    {
        public AdminCreateUserDtoValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Name không được để trống")
                .MaximumLength(100).WithMessage("Name tối đa 100 ký tự");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống")
                .MaximumLength(100).WithMessage("Email tối đa 100 ký tự")
                .EmailAddress().WithMessage("Email không đúng định dạng");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Phone không được để trống")
                .Matches("^[0-9]{10}$").WithMessage("Phone phải đúng 10 chữ số");

            RuleFor(x => x.PasswordHash)
                .NotEmpty().WithMessage("Mật khẩu không được để trống")
                .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
                .MaximumLength(50).WithMessage("Mật khẩu tối đa 50 ký tự")
                .Matches("[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ in hoa")
                .Matches("[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường")
                .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số")
                .Matches("[^a-zA-Z0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");

            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role không được để trống")
                .Must(role => UserRoleNames.Allowed.Contains(role)).WithMessage("Role không hợp lệ");
        }
    }
}
