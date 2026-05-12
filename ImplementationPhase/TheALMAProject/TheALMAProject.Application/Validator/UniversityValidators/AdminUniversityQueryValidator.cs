using FluentValidation;
using TheALMAProject.Domain.Queries;

namespace TheALMAProject.Application.Validator.UniversityValidators
{
    public class AdminUniversityQueryValidator : AbstractValidator<AdminUniversityQuery>
    {
        public AdminUniversityQueryValidator()
        {
            RuleFor(x => x.PageNumber)
                .GreaterThan(0).WithMessage("PageNumber phải lớn hơn 0");

            RuleFor(x => x.PageSize)
                .GreaterThan(0).WithMessage("PageSize phải lớn hơn 0");

            RuleFor(x => x.Name)
                .MaximumLength(255).When(x => !string.IsNullOrWhiteSpace(x.Name))
                .WithMessage("Tên trường tối đa 255 ký tự");
        }
    }
}
