namespace TheALMAProject.Application.DTOs.AdminUniversityDtos
{
    public class AdminUpdateUniversityDto
    {
        public string Name { get; set; } = null!;

        public string? LogoUrl { get; set; }

        public bool IsActive { get; set; }
    }
}
