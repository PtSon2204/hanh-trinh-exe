import type { Decimal, IsoDateString, PaginationQuery } from "../../../shared/types/api";

export interface ProductReviewDto {
  reviewId: number;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string | null;
  createdAt: IsoDateString | null;
}

export interface ProductListItemDto {
  productId: number;
  name: string;
  description: string | null;
  price: Decimal;
  imageUrl: string | null;
  isCustomizable: boolean;
  category: string | null;
  material: string | null;
  universityName: string | null;
  averageRating: number;
  reviewCount: number;
}

export interface ProductDetailDto extends ProductListItemDto {
  frontImageUrl: string | null;
  backImageUrl: string | null;
  basePrice: Decimal | null;
  availableSizes: string[];
  availableColors: string[];
  universityId: number | null;
  universityLogoUrl: string | null;
  reviews: ProductReviewDto[];
}

export interface SearchProductDto {
  productId: number;
  name: string;
  imageUrl: string | null;
  price: Decimal;
  category: string | null;
  universityName: string | null;
}

export interface ProductQuery extends PaginationQuery {
  keyword?: string;
  category?: string;
  universityId?: number;
}
