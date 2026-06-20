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
	requiresSize: boolean;
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
	refundBankName: string | null;
	refundAccountNumber: string | null;
	refundAccountName: string | null;
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

export interface AdminStatusBreakdownDto {
	status: string;
	orderCount: number;
	itemCount: number;
	revenue: Decimal;
}

export interface AdminAgingBucketDto {
	label: string;
	orderCount: number;
}

export interface AdminOperationalExceptionDto {
	label: string;
	count: number;
	severity: "info" | "warning" | "danger" | string;
}

export interface AdminOperationStatisticsDto {
	totalOrders: number;
	totalItems: number;
	totalRevenue: Decimal;
	orderStatusBreakdown: AdminStatusBreakdownDto[];
	paymentStatusBreakdown: AdminStatusBreakdownDto[];
	agingBuckets: AdminAgingBucketDto[];
	exceptions: AdminOperationalExceptionDto[];
	ordersNeedingProduction: number;
	ordersNeedingShipping: number;
	customItemsNeedingExport: number;
}

export interface AdminTopProductDto {
	productId: number | null;
	productName: string;
	universityName: string | null;
	quantitySold: number;
	orderCount: number;
	revenue: Decimal;
	customItemCount: number;
}

export interface AdminTopBaseProductDto {
	baseProductId: number | null;
	baseProductName: string;
	category: string | null;
	quantitySold: number;
	orderCount: number;
	revenue: Decimal;
}

export interface AdminTopUniversityDto {
	universityId: number | null;
	universityName: string;
	quantitySold: number;
	orderCount: number;
	revenue: Decimal;
}

export interface AdminCustomizationTrendDto {
	period: string;
	customItemCount: number;
	readyMadeItemCount: number;
	customRevenue: Decimal;
	readyMadeRevenue: Decimal;
}

export interface AdminProductStatisticsDto {
	totalItemsSold: number;
	totalOrders: number;
	customItemCount: number;
	readyMadeItemCount: number;
	customRevenue: Decimal;
	readyMadeRevenue: Decimal;
	topStoreProducts: AdminTopProductDto[];
	topBaseProducts: AdminTopBaseProductDto[];
	topUniversities: AdminTopUniversityDto[];
	customizationTrend: AdminCustomizationTrendDto[];
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
