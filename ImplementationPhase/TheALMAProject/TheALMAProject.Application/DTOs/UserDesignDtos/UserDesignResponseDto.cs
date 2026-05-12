using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.UserDesignDtos
{
    public class UserDesignResponseDto
    {
        public int DesignId { get; set; }
        public int BaseProductId { get; set; }
        public string? DesignName { get; set; }
        public string? PreviewImageUrl { get; set; }
        public bool IsOrdered { get; set; }
        public DateTime? CreatedAt { get; set; }

        public decimal TotalEstimatedPrice { get; set; }
    }
}
