namespace TheALMAProject.Application.DTOs.BaseProductDtos
{
    public class BaseProduct3DConfigDto
    {
        public int BaseProduct3DConfigId { get; set; }

        public string ModelUrl { get; set; } = null!;

        public string CenterOffsetJson { get; set; } = null!;

        public string? FrontPrintPlaneJson { get; set; }

        public string? BackPrintPlaneJson { get; set; }
    }
}
