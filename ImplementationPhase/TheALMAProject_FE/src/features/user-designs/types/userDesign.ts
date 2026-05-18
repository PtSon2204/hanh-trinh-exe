import type { Decimal, IsoDateString } from "../../../shared/types/api";

export interface CreateUserDesignDto {
  baseProductId: number;
  canvasJson: string;
  previewImageUrl?: string | null;
  printFileUrl?: string | null;
  designName?: string | null;
  iconIds: number[];
  fontIds: number[];
}

export interface UpdateUserDesignDto {
  designName?: string | null;
  baseProductId?: number | null;
  canvasJson?: string | null;
  previewImageUrl?: string | null;
  iconIds: number[];
  fontIds: number[];
}

export interface UserDesignResponseDto {
  designId: number;
  baseProductId: number;
  designName: string | null;
  previewImageUrl: string | null;
  isOrdered: boolean;
  createdAt: IsoDateString | null;
  totalEstimatedPrice: Decimal;
}
