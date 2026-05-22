import type {
	Decimal,
	IsoDateString,
	PaginationQuery,
} from "../../../../shared/types/api";

export interface AdminVoucherListDto {
	voucherId: number;
	code: string;
	discountPercent: Decimal;
	maxDiscount: Decimal;
	minOrderAmount: Decimal;
	usageLimit: number;
	usedCount: number;
	startDate: IsoDateString;
	endDate: IsoDateString;
	isActive: boolean;
}

export interface AdminVoucherDto extends AdminVoucherListDto {
}

export interface AdminCreateVoucherDto {
	code: string;
	discountPercent: Decimal;
	maxDiscount: Decimal;
	minOrderAmount: Decimal;
	usageLimit: number;
	startDate: IsoDateString;
	endDate: IsoDateString;
	isActive: boolean;
}

export type AdminUpdateVoucherDto = AdminCreateVoucherDto;

export interface AdminVoucherQuery extends PaginationQuery {
	isActive?: boolean;
}
