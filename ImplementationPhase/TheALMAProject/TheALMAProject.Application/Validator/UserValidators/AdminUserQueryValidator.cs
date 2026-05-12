using FluentValidation;
using TheALMAProject.Application.Constants;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Validator.UserValidators
{
    public class AdminUserQueryValidator : AbstractValidator<AdminUserQuery>
    {
        public AdminUserQueryValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThan(0).WithMessage("PageNumber phải lớn hơn 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0).WithMessage("PageSize phải lớn hơn 0");

            RuleFor(x => x.Email)
                .MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("Email tối đa 100 ký tự");

            RuleFor(x => x.FullName)
                .MaximumLength(100).When(x => !string.IsNullOrWhiteSpace(x.FullName))
                .WithMessage("Name tối đa 100 ký tự");

            RuleFor(x => x.Phone)
                .Matches("^[0-9]{10}$").When(x => !string.IsNullOrWhiteSpace(x.Phone))
                .WithMessage("Phone phải đúng 10 chữ số");

            RuleFor(x => x.Role)
                .Must(role => string.IsNullOrWhiteSpace(role) || UserRoleNames.Allowed.Contains(role))
                .WithMessage("Role không hợp lệ");
        }
    }
}
