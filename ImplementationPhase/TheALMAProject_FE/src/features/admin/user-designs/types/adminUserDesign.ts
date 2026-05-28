import type { IsoDateString, PaginationQuery } from "../../../../shared/types/api";

export interface AdminUserDesignListDto {
	designId: number;
	designName: string | null;
	previewImageUrl: string | null;
	frontPreviewImageUrl: string | null;
	backPreviewImageUrl: string | null;
	isOrdered: boolean;
	createdAt: IsoDateString | null;
	userEmail: string;
	baseProductName: string;
}

export interface AdminUserDesignDto extends AdminUserDesignListDto {
	userId: number;
	baseProductId: number;
	canvasJson: string;
	frontCanvasJson: string | null;
	backCanvasJson: string | null;
	printFileUrl: string | null;
}

export interface AdminUserDesignQuery extends PaginationQuery {}

export interface AdminUserDesignMutationResponse {
	message: string;
}
