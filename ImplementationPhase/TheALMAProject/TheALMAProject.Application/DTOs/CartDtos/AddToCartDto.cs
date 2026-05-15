using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.CartDtos
{
    public class AddToCartDto
    {
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
    }

    /// <summary>Một dòng size + số lượng</summary>
    public class SizeQuantityDto
    {
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
    }

    /// <summary>Thêm nhiều size cùng lúc sau khi lưu thiết kế</summary>
    public class AddDesignMultiSizeDto
    {
        public int DesignId { get; set; }
        public List<SizeQuantityDto> Items { get; set; } = new();
    }
}
