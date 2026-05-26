import type {
  Decimal,
  IsoDateString,
  OrderStatus,
  PaginationQuery,
  PaymentStatus,
} from "../../../shared/types/api";

export interface OrderResponseDto {
  orderId: number;
  orderCode: string;
  totalAmount: Decimal;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: IsoDateString | null;
}

export interface OrderItemResponseDto {
  orderItemId: number;
  productId: number | null;
  designId: number | null;
  itemName: string;
  imageUrl: string | null;
  size: string;
  quantity: number;
  unitPrice: Decimal;
  isCustomDesign: boolean;
}

export interface OrderDetailResponseDto extends OrderResponseDto {
  shippingFee: Decimal;
  discountAmount: Decimal;
  paymentMethod: string;
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipProvince: string;
  voucherCode: string | null;
  voucherDiscountPercent: Decimal | null;
  items: OrderItemResponseDto[];
  refundBankName: string | null;
  refundAccountNumber: string | null;
  refundAccountName: string | null;
}

export interface CheckoutRequestDto {
  shipName: string;
  shipPhone: string;
  shipAddress: string;
  shipProvince: string;
  paymentMethod: string;
  voucherCode?: string | null;
}

export interface CheckoutResponseDto {
  isSuccess: boolean;
  message: string;
  orderId: number | null;
  paymentUrl: string | null;
}

export interface OrderQuery extends PaginationQuery {
  status?: OrderStatus;
}
