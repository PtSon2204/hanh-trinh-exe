using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.UserDesignDtos
{
    public class UpdateUserDesignDto
    {
        public string? DesignName { get; set; }
        public int? BaseProductId { get; set; } 
        public string? CanvasJson { get; set; }  
        public string? PreviewImageUrl { get; set; }

        public List<int> IconIds { get; set; } = new List<int>();
        public List<int> FontIds { get; set; } = new List<int>();
    }
}
