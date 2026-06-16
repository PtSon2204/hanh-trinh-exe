/* ─── Product Types ─── mapping 1:1 với backend DTOs ─── */

/** UC-08: Danh sách sản phẩm (ProductListItemDto) */
export interface ProductListItem {
  productId: number;
  baseProductId?: number | null;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isCustomizable: boolean;
  category?: string;
  material?: string;
  universityName?: string;
  averageRating: number;
  reviewCount: number;
}

/** UC-09: Chi tiết sản phẩm (ProductDetailDto) */
export interface ProductDetail {
  productId: number;
  baseProductId?: number | null;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isCustomizable: boolean;
  frontImageUrl?: string;
  backImageUrl?: string;
  category?: string;
  material?: string;
  basePrice?: number;
  availableSizes: string[];
  availableColors: string[];
  universityId?: number;
  universityName?: string;
  universityLogoUrl?: string;
  averageRating: number;
  reviewCount: number;
  reviews: ProductReview[];
}

/** UC-09: Review trong chi tiết SP (ProductReviewDto) */
export interface ProductReview {
  reviewId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

/** UC-10: Kết quả search nhanh (SearchProductDto) */
export interface SearchProduct {
  productId: number;
  baseProductId?: number | null;
  name: string;
  imageUrl?: string;
  price: number;
  category?: string;
  universityName?: string;
}

/** Query params cho GET /api/Products */
export interface ProductQuery {
  keyword?: string;
  name?: string;
  category?: string;
  material?: string;
  university?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber?: number;
  pageSize?: number;
  universityId?: number;
  baseProductId?: number;
  hasBaseProduct?: boolean;
  isActive?: boolean;
  isCustomizable?: boolean;
}

export interface ProductFilterUniversityOption {
  universityId: number;
  name: string;
}

export interface ProductFilterOptions {
  categories: string[];
  materials: string[];
  universities: ProductFilterUniversityOption[];
  minPrice: number | null;
  maxPrice: number | null;
}
