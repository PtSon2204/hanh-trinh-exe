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

export interface PrintPlane3DConfig {
    position: [number, number, number];
    rotation: [number, number, number];
    size: [number, number];
    renderMode?: 'plane' | 'sampledDepth';
    segments?: [number, number];
    projectionDirection?: [number, number, number];
    maxProjectionDistance?: number;
    surfaceOffset?: number;
    projectionStrength?: number;
    fallbackBend?: number;
    smoothIterations?: number;
    authoredTextureOffset?: [number, number];
    authoredTextureRepeat?: [number, number];
}

export interface BaseProduct3DConfigDto {
    baseProduct3DConfigId?: number;
    modelUrl: string;
    centerOffsetJson: string;
    frontPrintPlaneJson?: string | null;
    backPrintPlaneJson?: string | null;
    centerOffset?: [number, number, number] | null;
    frontPrintPlane?: PrintPlane3DConfig | null;
    backPrintPlane?: PrintPlane3DConfig | null;
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
    threeDConfig?: BaseProduct3DConfigDto | null;
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
