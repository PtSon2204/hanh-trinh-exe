export interface OrderResponseDto {
  orderId: number;
  orderCode: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  // ... thêm các trường khác khớp với Backend
}

export interface OrderQuery {
  pageNumber?: number;
  pageSize?: number;
  status?: string; // Ví dụ để filter trạng thái
}