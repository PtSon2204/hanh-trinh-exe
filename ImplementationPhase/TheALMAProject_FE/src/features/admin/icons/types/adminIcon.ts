export interface AdminIconListDto {
  iconId: number;
  name: string;
  imageUrl: string | null;
  priceAddon: number;
  category: string;
  isActive: boolean;
}

export interface AdminIconDto extends AdminIconListDto {}

export interface AdminIconQuery {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  isActive?: boolean;
}

export interface AdminIconMutationDto {
  name: string;
  imageFile?: File | null;
  priceAddon: number;
  category: string;
  isActive: boolean;
}

export interface AdminIconMutationResponse {
  message: string;
}
