namespace TheALMAProject.Application.DTOs.AdminStatisticsDtos
{
    public class AdminOperationalExceptionDto
    {
        public string Label { get; set; } = null!;
        public int Count { get; set; }
        public string Severity { get; set; } = null!; // info, warning, danger
    }
}
