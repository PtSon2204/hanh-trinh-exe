import type {
	DateRangeQuery,
	Decimal,
	IsoDateString,
	OrderStatus,
	PaginationQuery,
	PaymentStatus,
} from "../../../../shared/types/api";

export interface AdminOrderItemDto {
	orderItemId: number;
	productId: number | null;
	designId: number | null;
	itemName: string;
	imageUrl: string | null;
	previewImageUrl: string | null;
	frontPreviewImageUrl: string | null;
	backPreviewImageUrl: string | null;
	canvasJson: string | null;
	frontCanvasJson: string | null;
	backCanvasJson: string | null;
	printAreaJson: string | null;
	productFrontImageUrl: string | null;
	productBackImageUrl: string | null;
	size: string;
	quantity: number;
	unitPrice: Decimal;
}

export interface AdminOrderFabricPrintFileItemDto {
	orderItemId: number;
	artworkPngDataUrl: string;
	placementGuidePngDataUrl: string;
}

export interface AdminOrderFabricPrintFileUploadDto {
	items: AdminOrderFabricPrintFileItemDto[];
}

export interface AdminOrderListDto {
	orderId: number;
	orderCode: string;
	userEmail: string;
	totalAmount: Decimal;
	paymentMethod: string;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	createdAt: IsoDateString | null;
}

export interface AdminOrderDto extends AdminOrderListDto {
	userId: number;
	shippingFee: Decimal;
	discountAmount: Decimal;
	voucherId: number | null;
	shipName: string;
	shipPhone: string;
	shipAddress: string;
	shipProvince: string;
	items: AdminOrderItemDto[];
}

export interface AdminUpdateOrderStatusDto {
	orderStatus: OrderStatus;
	paymentStatus: PaymentStatus;
}

export interface AdminCreateOrderItemDto {
	productId: number | null;
	designId: number | null;
	size: string;
	quantity: number;
	unitPrice: Decimal;
}

export interface AdminCreateOrderDto {
	userId: number;
	shipName: string;
	shipPhone: string;
	shipAddress: string;
	shipProvince: string;
	shippingFee: Decimal;
	discountAmount: Decimal;
	voucherId: number | null;
	paymentMethod: string;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	items: AdminCreateOrderItemDto[];
}

export interface AdminOrderStatusUpdateResponse {
	message: string;
}

export interface AdminOrderPrintFileDto {
	orderId: number;
	orderCode: string;
	orderItemId: number;
	designId: number;
	designName: string | null;
	size: string;
	quantity: number;
	printFileUrl: string;
	placementGuideUrl: string;
}

export interface AdminOrderStatisticDto {
	period: string;
	orderCount: number;
	itemCount: number;
	totalRevenue: Decimal;
	totalShippingFee: Decimal;
	totalDiscount: Decimal;
	totalSubTotal: Decimal;
}

export interface AdminOrderQuery extends PaginationQuery {
	orderStatus?: OrderStatus;
	paymentStatus?: PaymentStatus;
}

export interface AdminOrderStatisticQuery extends DateRangeQuery {
	groupBy?: "day" | "week" | "month";
	orderStatus?: OrderStatus;
	paymentStatus?: PaymentStatus;
}
