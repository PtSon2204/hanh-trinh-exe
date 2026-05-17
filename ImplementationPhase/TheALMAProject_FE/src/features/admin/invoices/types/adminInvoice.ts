import type {
	DateRangeQuery,
	Decimal,
	InvoiceStatus,
	IsoDateString,
	OrderStatus,
	PaginationQuery,
	PaymentStatus,
} from "../../../../shared/types/api";

export interface AdminInvoiceOrderItemDto {
	orderItemId: number;
	productId: number | null;
	designId: number | null;
	itemName: string;
	imageUrl: string | null;
	size: string;
	quantity: number;
	unitPrice: Decimal;
	lineTotal: Decimal;
}

export interface AdminInvoiceListDto {
	invoiceId: number;
	orderId: number;
	orderCode: string | null;
	userId: number;
	userEmail: string | null;
	invoiceNumber: string;
	issueDate: IsoDateString;
	billingName: string;
	currencyCode: string;
	totalAmount: Decimal;
	invoiceStatus: InvoiceStatus;
	pdfUrl: string | null;
}

export interface AdminInvoiceDto extends AdminInvoiceListDto {
	userFullName: string | null;
	billingAddress: string;
	buyerPhone: string | null;
	buyerEmail: string | null;
	subTotal: Decimal;
	voucherDiscountAmount: Decimal;
	shippingFee: Decimal;
	createdAt: IsoDateString;
	paymentMethod: string | null;
	paymentStatus: PaymentStatus | null;
	orderStatus: OrderStatus | null;
	items: AdminInvoiceOrderItemDto[];
}

export interface AdminFinancialReportDto {
	period: string;
	currencyCode: string;
	invoiceCount: number;
	totalRevenue: Decimal;
	totalShippingFee: Decimal;
	totalDiscount: Decimal;
	totalSubTotal: Decimal;
}

export interface AdminInvoiceQuery extends PaginationQuery {
	invoiceStatus?: InvoiceStatus;
}

export interface AdminFinancialReportQuery extends DateRangeQuery {
	groupBy?: "day" | "week" | "month";
}
