using FluentValidation;
using TheALMAProject.Application.DTOs.AdminUniversityDtos;

namespace TheALMAProject.Application.Validator.UniversityValidators
{
    public class CreateUniversityDtoValidator : AbstractValidator<AdminCreateUniversityDto>
    {
        public CreateUniversityDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên trường không để trống")
                .MaximumLength(255).WithMessage("Tên trường tối đa 255 ký tự");

            RuleFor(x => x.LogoUrl)
                .MaximumLength(500).When(x => !string.IsNullOrWhiteSpace(x.LogoUrl))
                .WithMessage("LogoUrl tối đa 500 ký tự");
        }
    }
}
