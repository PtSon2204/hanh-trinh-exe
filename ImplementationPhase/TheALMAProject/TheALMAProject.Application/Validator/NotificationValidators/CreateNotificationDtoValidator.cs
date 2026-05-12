using FluentValidation;
using TheALMAProject.Application.DTOs.NotificationDtos;

namespace TheALMAProject.Application.Validator.NotificationValidators
{
    /// <summary>
    /// UC-40: Validate tạo notification (Admin)
    /// </summary>
    public class CreateNotificationDtoValidator : AbstractValidator<CreateNotificationDto>
    {
        // Danh sách các Type hợp lệ
        private static readonly string[] ValidTypes = { "Order", "NewOrder", "System", "Promotion", "Info" };

        public CreateNotificationDtoValidator()
        {
            RuleFor(x => x.UserId)
                .GreaterThan(0).WithMessage("UserId phải lớn hơn 0.");

            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề thông báo không được để trống.")
                .MaximumLength(255).WithMessage("Tiêu đề tối đa 255 ký tự.");

            RuleFor(x => x.Message)
                .NotEmpty().WithMessage("Nội dung thông báo không được để trống.")
                .MaximumLength(1000).WithMessage("Nội dung tối đa 1000 ký tự.");

            RuleFor(x => x.Type)
                .NotEmpty().WithMessage("Loại thông báo không được để trống.")
                .MaximumLength(50).WithMessage("Loại thông báo tối đa 50 ký tự.")
                .Must(t => ValidTypes.Contains(t))
                    .WithMessage($"Loại thông báo phải là một trong: {string.Join(", ", ValidTypes)}.");
        }
    }
}
