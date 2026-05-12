using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.ReviewDtos
{
    public class CreateReviewRequestDto
    {
        public int ProductId { get; set; }
        public int OrderId { get; set; }
        public int Rating { get; set; } // Nên validate từ 1 đến 5
        public string? Comment { get; set; }
    }
}
