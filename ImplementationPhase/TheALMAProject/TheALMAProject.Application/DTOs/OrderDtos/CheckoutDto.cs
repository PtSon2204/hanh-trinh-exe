using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.OrderDtos
{
    public class CheckoutRequestDto
    {
        public string ShipName { get; set; } = null!;
        public string ShipPhone { get; set; } = null!;
        public string ShipAddress { get; set; } = null!;
        public string ShipProvince { get; set; } = null!;

        public string PaymentMethod { get; set; } = null!; 
        public string? VoucherCode { get; set; } 
    }

    // DTO trả kết quả về cho Frontend
    public class CheckoutResponseDto
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = null!;
        public int? OrderId { get; set; }
        public string? PaymentUrl { get; set; }
    }

    public class ChangePaymentMethodRequestDto
    {
        public string PaymentMethod { get; set; } = null!;
    }

    public class UpdateShippingAddressDto
    {
        public string ShipName { get; set; } = null!;
        public string ShipPhone { get; set; } = null!;
        public string ShipAddress { get; set; } = null!;
        public string ShipProvince { get; set; } = null!;
    }

    public class VoucherCheckResponseDto
    {
        public bool IsValid { get; set; }
        public string Message { get; set; } = null!;
        public decimal DiscountAmount { get; set; }
        public bool IsFreeShipping { get; set; }
    }
}
