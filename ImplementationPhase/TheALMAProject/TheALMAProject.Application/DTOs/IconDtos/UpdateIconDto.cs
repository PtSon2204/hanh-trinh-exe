using Microsoft.AspNetCore.Http;

namespace TheALMAProject.Application.DTOs.IconDtos
{
    public class UpdateIconDto
    {
        public string Name { get; set; } = null!;

        public IFormFile? ImageFile { get; set; }

        public decimal PriceAddon { get; set; }

        public string Category { get; set; } = null!;

        public bool IsActive { get; set; }
    }
}
