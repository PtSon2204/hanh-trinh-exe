namespace TheALMAProject.Application.DTOs.AdminUniversityDtos
{
    public class AdminCreateUniversityDto
    {
        public string Name { get; set; } = null!;

        public string? LogoUrl { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
