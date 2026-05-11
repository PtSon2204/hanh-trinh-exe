namespace TheALMAProject.Application.DTOs.IconDtos
{
    public class IconDto
    {
        public int IconId { get; set; }

        public string Name { get; set; } = null!;

        public string ImageUrl { get; set; } = null!;

        public decimal PriceAddon { get; set; }

        public string Category { get; set; } = null!;

        public bool IsActive { get; set; }
    }
}
