using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.OrderDtos
{
    public class OrderItemResponseDto
    {
        public int OrderItemId { get; set; }
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? ImageUrl { get; set; }

        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }

        //cái này để hiển thị "Áo tự thiết kế"
        public bool IsCustomDesign => DesignId.HasValue;
    }
}
