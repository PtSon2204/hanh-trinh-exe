using FluentValidation;
using TheALMAProject.Application.Constants;
using TheALMAProject.Application.DTOs.AdminUserDtos;

namespace TheALMAProject.Application.Validator.UserValidators
{
    public class AdminAssignRoleDtoValidator : AbstractValidator<AdminAssignRoleDto>
    {
        public AdminAssignRoleDtoValidator()
        {
            RuleFor(x => x.Role)
                .NotEmpty().WithMessage("Role không được để trống")
                .Must(role => UserRoleNames.Allowed.Contains(role)).WithMessage("Role không hợp lệ");
        }
    }
}
