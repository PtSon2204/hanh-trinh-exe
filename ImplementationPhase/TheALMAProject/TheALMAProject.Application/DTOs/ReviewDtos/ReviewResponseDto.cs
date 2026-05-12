using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheALMAProject.Application.DTOs.ReviewDtos
{
    public class ReviewResponseDto
    {
        public int ReviewId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string UserName { get; set; } = null!;
        public string? AvatarUrl { get; set; }
    }
}
