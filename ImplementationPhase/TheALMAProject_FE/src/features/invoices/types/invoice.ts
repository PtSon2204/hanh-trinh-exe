import type { Decimal, InvoiceStatus, IsoDateString } from "../../../shared/types/api";

export interface InvoiceResponseDto {
  invoiceNumber: string;
  issueDate: IsoDateString;
  billingName: string;
  billingAddress: string;
  buyerPhone: string | null;
  buyerEmail: string | null;
  currencyCode: string;
  subTotal: Decimal;
  voucherDiscountAmount: Decimal;
  shippingFee: Decimal;
  totalAmount: Decimal;
  invoiceStatus: InvoiceStatus;
  pdfUrl: string | null;
}
