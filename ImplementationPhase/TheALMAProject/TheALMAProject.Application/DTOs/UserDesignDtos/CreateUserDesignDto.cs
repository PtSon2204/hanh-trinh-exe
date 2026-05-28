using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.UserDesignDtos
{
    public class CreateUserDesignDto
    {
        public int BaseProductId { get; set; } 
        public string CanvasJson { get; set; } = null!; 
        public string? FrontCanvasJson { get; set; }
        public string? BackCanvasJson { get; set; }
        public string? PreviewImageUrl { get; set; } 
        public string? FrontPreviewImageUrl { get; set; }
        public string? BackPreviewImageUrl { get; set; }
        public string? PrintFileUrl { get; set; } 
        public string? DesignName { get; set; } 

        // Danh sách các Icon và Font mà khách đã kéo vào áo
        public List<int> IconIds { get; set; } = new List<int>();
        public List<int> FontIds { get; set; } = new List<int>();
    }
}
