import type { Decimal, IsoDateString } from "../../../shared/types/api";

export interface CreateUserDesignDto {
  baseProductId: number;
  canvasJson: string;
  frontCanvasJson?: string | null;
  backCanvasJson?: string | null;
  previewImageUrl?: string | null;
  frontPreviewImageUrl?: string | null;
  backPreviewImageUrl?: string | null;
  printFileUrl?: string | null;
  designName?: string | null;
  iconIds: number[];
  fontIds: number[];
}

export interface UpdateUserDesignDto {
  designName?: string | null;
  baseProductId?: number | null;
  canvasJson?: string | null;
  frontCanvasJson?: string | null;
  backCanvasJson?: string | null;
  previewImageUrl?: string | null;
  frontPreviewImageUrl?: string | null;
  backPreviewImageUrl?: string | null;
  iconIds: number[];
  fontIds: number[];
}

export interface UserDesignResponseDto {
  designId: number;
  baseProductId: number;
  designName: string | null;
  canvasJson: string | null;
  frontCanvasJson: string | null;
  backCanvasJson: string | null;
  previewImageUrl: string | null;
  frontPreviewImageUrl: string | null;
  backPreviewImageUrl: string | null;
  isOrdered: boolean;
  createdAt: IsoDateString | null;
  totalEstimatedPrice: Decimal;
}
