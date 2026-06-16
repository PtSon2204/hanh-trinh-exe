export interface AdminBaseProductListDto {
  baseProductId: number;
  name: string;
  basePrice: number;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  category: string;
  material: string;
  availableColors: string | null;
  availableSizes: string | null;
  isActive: boolean;
}

export interface AdminBaseProduct3DConfigDto {
  baseProduct3DConfigId?: number;
  modelUrl: string;
  centerOffsetJson: string;
  frontPrintPlaneJson: string | null;
  backPrintPlaneJson: string | null;
}

export interface AdminBaseProductDto extends AdminBaseProductListDto {
  printAreaJson: string | null;
  threeDConfig?: AdminBaseProduct3DConfigDto | null;
}

export interface AdminBaseProductMutationDto {
  name: string;
  basePrice: number;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  printAreaJson: string | null;
  category: string;
  material: string;
  availableColors: string | null;
  availableSizes: string | null;
  isActive: boolean;
  threeDConfig: AdminBaseProduct3DConfigDto | null;
}

export interface AdminBaseProductQuery {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  material?: string;
  isActive?: boolean;
}

export interface AdminStoreProductListDto {
  productId: number;
  baseProductId: number | null;
  universityId: number | null;
  name: string;
  price: number;
  imageUrl: string | null;
  isCustomizable: boolean;
  isActive: boolean;
}

export interface AdminStoreProductDto extends AdminStoreProductListDto {
  description: string | null;
}

export interface AdminCreateStoreProductDto {
  baseProductId: number | null;
  universityId: number | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  isCustomizable: boolean;
}

export interface AdminUpdateStoreProductDto {
  baseProductId: number | null;
  universityId: number | null;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  isCustomizable: boolean;
}

export interface AdminStoreProductQuery {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  baseProductId?: number;
  universityId?: number;
  isActive?: boolean;
  isCustomizable?: boolean;
  category?: string;
  material?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface AdminMutationResponse {
  message: string;
}
