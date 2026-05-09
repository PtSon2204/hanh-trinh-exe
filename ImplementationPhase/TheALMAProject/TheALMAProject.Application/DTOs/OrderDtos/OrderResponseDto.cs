using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.OrderDtos
{
    public class OrderResponseDto
    {
        public int OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public decimal TotalAmount { get; set; }
        public string OrderStatus { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
    }
}
