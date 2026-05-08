using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;

namespace TheALMAProject.Application.DTOs.CartDtos
{
    public class AddToCartDto
    {
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string Size { get; set; } = null!;
        public int Quantity { get; set; }
    }
}
