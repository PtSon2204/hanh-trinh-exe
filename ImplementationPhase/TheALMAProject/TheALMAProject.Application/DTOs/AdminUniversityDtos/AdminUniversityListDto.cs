namespace TheALMAProject.Application.DTOs.AdminUniversityDtos
{
    public class AdminUniversityListDto
    {
        public int UniversityId { get; set; }

        public string Name { get; set; } = null!;

        public string? LogoUrl { get; set; }

        public bool IsActive { get; set; }
    }
}
