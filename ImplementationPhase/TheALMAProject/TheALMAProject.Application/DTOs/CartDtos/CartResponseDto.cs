namespace TheALMAProject.Application.DTOs.CartDtos
{
    public class CartItemResponseDto
    {
        public int CartItemId { get; set; }
        public int? ProductId { get; set; }
        public int? DesignId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Size { get; set; } = string.Empty;
        public bool RequiresSize { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class CartResponseDto
    {
        public int CartId { get; set; }
        public int UserId { get; set; }
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalAmount => Items.Sum(i => i.UnitPrice * i.Quantity);
    }

    public class UpdateCartItemDto
    {
        public int Quantity { get; set; }
        public string Size { get; set; } = null!;
    }
}
