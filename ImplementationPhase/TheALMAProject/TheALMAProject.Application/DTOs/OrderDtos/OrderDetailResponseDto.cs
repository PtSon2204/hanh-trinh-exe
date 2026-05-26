using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.OrderDtos
{
    public class OrderDetailResponseDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public decimal DiscountAmount { get; set; }

        public string OrderStatus { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string PaymentMethod { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }

        // Thông tin giao hàng
        public string ShipName { get; set; } = null!;
        public string ShipPhone { get; set; } = null!;
        public string ShipAddress { get; set; } = null!;
        public string ShipProvince { get; set; } = null!;

        // Thông tin Voucher (Nếu có)
        public string? VoucherCode { get; set; }
        public decimal? VoucherDiscountPercent { get; set; }

        // Danh sách sản phẩm
        public List<OrderItemResponseDto> Items { get; set; } = new List<OrderItemResponseDto>();

        // Thông tin hoàn tiền (nếu có)
        public string? RefundBankName { get; set; }
        public string? RefundAccountNumber { get; set; }
        public string? RefundAccountName { get; set; }
    }
}
