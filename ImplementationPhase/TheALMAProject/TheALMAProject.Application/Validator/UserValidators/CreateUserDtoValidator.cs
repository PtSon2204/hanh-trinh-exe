using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FluentValidation;
using TheALMAProject.Application.DTOs.UserDtos;

namespace TheALMAProject.Application.Validator.UserValidators
{
    public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
    {
        public CreateUserDtoValidator()
        {
            RuleFor(x => x.FullName)
             .NotEmpty().WithMessage("Name không được để trống")
             .MaximumLength(100).WithMessage("Name tối đa 100 ký tự");

            RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống")
            .MaximumLength(100).WithMessage("Email tối đa 100 ký tự");

            RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone không được để trống")
            .MaximumLength(10).WithMessage("Phone tối đa 10 chữ số");

            RuleFor(x => x.PasswordHash) 
            .NotEmpty().WithMessage("Mật khẩu không được để trống")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự")
            .MaximumLength(50).WithMessage("Mật khẩu tối đa 50 ký tự")
            .Matches("[A-Z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ in hoa")
            .Matches("[a-z]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ thường")
            .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 chữ số")
            .Matches("[^a-zA-Z0-9]").WithMessage("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt");
        }
    }
}
