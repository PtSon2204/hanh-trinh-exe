export interface CartItemDto {
  cartItemId: number;
  productId?: number;
  designId?: number;
  productName: string; // Tên áo (Áo mẫu sẵn hoặc Áo tự thiết kế)
  imageUrl: string;
  size: string;
  requiresSize: boolean;
  quantity: number;
  unitPrice: number;
}

export interface CartResponseDto {
  cartId: number;
  userId: number;
  items: CartItemDto[];
  totalAmount: number; // Tổng tiền trước giảm giá
}
