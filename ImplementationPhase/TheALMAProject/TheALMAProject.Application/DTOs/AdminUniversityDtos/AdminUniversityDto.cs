namespace TheALMAProject.Application.DTOs.AdminUniversityDtos
{
    public class AdminUniversityDto
    {
        public int UniversityId { get; set; }

        public string Name { get; set; } = null!;

        public string? LogoUrl { get; set; }

        public bool IsActive { get; set; }
    }
}
