using FluentValidation;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Application.DTOs.StoreProductDtos;

namespace TheALMAProject.Application.Validator.StoreProductValidators
{
    public class UpdateStoreProductDtoValidator : AbstractValidator<UpdateStoreProductDto>
    {
        public UpdateStoreProductDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên sản phẩm không được để trống")
                .MaximumLength(100).WithMessage("Tên sản phẩm tối đa 100 ký tự");

            RuleFor(x => x.Price)
                .NotEmpty().WithMessage("Giá cả không được để trống")
                .GreaterThan(0).WithMessage("Sản phẩm phải có giá trị lớn hơn 0");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Miêu tả sàn phẩm tối đa 500 kí tự");
        }
    }
}
