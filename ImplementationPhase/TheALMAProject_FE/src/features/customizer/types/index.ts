export interface PrintAreaRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ProductPrintArea {
    front?: PrintAreaRect;
    back?: PrintAreaRect;
}

export interface BaseProductDto {
    baseProductId: number;
    name: string;
    basePrice: number;
    frontImageUrl: string;
    backImageUrl?: string;
    availableColors: string; // VD: "#FFFFFF,#000000"
    printAreaJson?: string | null;
    printArea?: ProductPrintArea | null;
}

export interface IconDto {
    iconId: number;
    name: string;
    imageUrl: string;
    priceAddon: number;
}

export interface CreateDesignRequest {
    baseProductId: number;
    canvasJson: string;
    frontCanvasJson?: string | null;
    backCanvasJson?: string | null;
    previewImageUrl?: string;
    frontPreviewImageUrl?: string | null;
    backPreviewImageUrl?: string | null;
    iconIds: number[];
    fontIds: number[];
}
