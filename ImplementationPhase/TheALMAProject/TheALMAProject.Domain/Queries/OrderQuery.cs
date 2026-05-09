using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class OrderQuery : PaginationParams
    {
        public string? OrderStatus { get; set; }

        public string? PaymentStatus { get; set; }

        public string? SearchKeyword { get; set; }

        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
