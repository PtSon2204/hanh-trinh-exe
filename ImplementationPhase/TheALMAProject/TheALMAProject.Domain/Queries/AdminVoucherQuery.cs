using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class AdminVoucherQuery : PaginationParams
    {
        public string? Code { get; set; }
        public decimal? DiscountPercent { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? MaxDiscount { get; set; }
        public decimal? MinOrderAmount { get; set; }
        public int? UsageLimit { get; set; }
        public int? UsedCount { get; set; }
        public bool? IsActive { get; set; }
    }
}