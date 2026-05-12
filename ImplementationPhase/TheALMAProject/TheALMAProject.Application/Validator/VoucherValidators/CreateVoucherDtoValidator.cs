using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.AdminVoucherDtos;

namespace TheALMAProject.Application.Validator.VoucherValidators
{
    public class CreateVoucherDtoValidator : AbstractValidator<AdminCreateVoucherDto>
    {
        public CreateVoucherDtoValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Code không để trống")
                .MaximumLength(20).WithMessage("Code tối đa 20 kí tự");

            RuleFor(x => x.DiscountPercent)
                .NotEmpty().WithMessage("Tỉ lệ Discount không để trống")
                .GreaterThanOrEqualTo(5).WithMessage("Ít nhất giảm 5%")
                .LessThanOrEqualTo(20).WithMessage("Giảm tối đa 20%");

            RuleFor(x => x.MaxDiscount)
                .NotEmpty().WithMessage("Giảm giá phải có giới hạn")
                .GreaterThan(0).WithMessage("Giảm giá giới hạn phải lớn hơn 0")
                .LessThanOrEqualTo(400000).WithMessage("Giảm giá giới hạn chỉ đến 400.000 VND");

            RuleFor(x => x.MinOrderAmount)
                .GreaterThanOrEqualTo(0).WithMessage("Giá trị đơn hàng tối thiểu không được âm");

            RuleFor(x => x.UsageLimit)
                .GreaterThan(0).WithMessage("Số lượt sử dụng phải lớn hơn 0");

            RuleFor(x => x.EndDate)
                .GreaterThanOrEqualTo(x => x.StartDate)
                .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu");

        }
    }
}
