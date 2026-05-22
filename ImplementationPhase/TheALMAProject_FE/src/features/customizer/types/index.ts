export interface BaseProductDto {
    baseProductId: number;
    name: string;
    basePrice: number;
    frontImageUrl: string;
    backImageUrl?: string;
    availableColors: string; // VD: "#FFFFFF,#000000"
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
    previewImageUrl?: string;
    iconIds: number[];
    fontIds: number[];
}