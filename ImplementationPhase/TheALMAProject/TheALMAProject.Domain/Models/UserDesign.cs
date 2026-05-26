namespace TheALMAProject.Infrastructure.Models;

public partial class UserDesign
{
    public int DesignId { get; set; }

    public int UserId { get; set; }

    public int BaseProductId { get; set; }

    public string CanvasJson { get; set; } = null!;

    public string? FrontCanvasJson { get; set; }

    public string? BackCanvasJson { get; set; }

    public string? PreviewImageUrl { get; set; }

    public string? FrontPreviewImageUrl { get; set; }

    public string? BackPreviewImageUrl { get; set; }

    public string? PrintFileUrl { get; set; }

    public string? PlacementGuideUrl { get; set; }

    public string? DesignName { get; set; }

    public bool IsOrdered { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual BaseProduct BaseProduct { get; set; } = null!;

    public virtual ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Font> Fonts { get; set; } = new List<Font>();

    public virtual ICollection<Icon> Icons { get; set; } = new List<Icon>();
}
