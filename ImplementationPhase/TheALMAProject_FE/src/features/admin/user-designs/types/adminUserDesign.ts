import type { IsoDateString } from "../../../../shared/types/api";

export interface AdminUserDesignListDto {
	designId: number;
	designName: string | null;
	previewImageUrl: string | null;
	isOrdered: boolean;
	createdAt: IsoDateString | null;
	userEmail: string;
	baseProductName: string;
}

export interface AdminUserDesignDto extends AdminUserDesignListDto {
	userId: number;
	baseProductId: number;
	canvasJson: string;
	printFileUrl: string | null;
}
