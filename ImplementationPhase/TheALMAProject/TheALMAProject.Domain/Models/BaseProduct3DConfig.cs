namespace TheALMAProject.Infrastructure.Models;

public partial class BaseProduct3DConfig
{
    public int BaseProduct3DConfigId { get; set; }

    public int BaseProductId { get; set; }

    public string ModelUrl { get; set; } = null!;

    public string CenterOffsetJson { get; set; } = null!;

    public string? FrontPrintPlaneJson { get; set; }

    public string? BackPrintPlaneJson { get; set; }

    public virtual BaseProduct BaseProduct { get; set; } = null!;
}
