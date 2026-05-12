using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TheALMAProject.Domain.Common;

namespace TheALMAProject.Domain.Queries
{
    public class UserDesignQuery : PaginationParams
    {
        public string? DesignName { get; set; } 
        public bool? IsOrdered { get; set; }    
    }
}
