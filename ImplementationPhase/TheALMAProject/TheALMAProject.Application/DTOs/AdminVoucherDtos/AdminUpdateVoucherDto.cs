using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.AdminVoucherDtos
{
    public class AdminUpdateVoucherDto
    {
        public string Code { get; set; } = null!;
        public decimal DiscountPercent { get; set; }
        public decimal MaxDiscount { get; set; }
        public decimal MinOrderAmount { get; set; }
        public int UsageLimit { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }
}
