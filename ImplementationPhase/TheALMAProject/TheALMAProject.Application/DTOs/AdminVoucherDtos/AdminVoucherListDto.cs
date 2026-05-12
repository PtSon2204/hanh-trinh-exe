using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.AdminVoucherDtos
{
    public class AdminVoucherListDto
    {
        public int VoucherId { get; set; }
        public string Code { get; set; } = null!;
        public decimal DiscountPercent { get; set; }
        public int UsageLimit { get; set; }
        public int UsedCount { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
    }
}
