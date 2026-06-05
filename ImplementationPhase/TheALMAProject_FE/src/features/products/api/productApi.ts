import axiosClient from '../../../shared/api/axiosClient';
import type { PagedResult } from '../../../shared/types/pagination';
import type {
  ProductDetail,
  ProductFilterOptions,
  ProductListItem,
  ProductQuery,
  SearchProduct,
} from '../../../shared/types/product.types';

const productApi = {
  /** UC-08: Danh sách sản phẩm với filter/sort/paging */
  getProducts(query: ProductQuery = {}): Promise<PagedResult<ProductListItem>> {
    return axiosClient
      .get<PagedResult<ProductListItem>>('/Products', { params: query })
      .then((res) => res.data);
  },

  getFilterOptions(): Promise<ProductFilterOptions> {
    return axiosClient
      .get<ProductFilterOptions>('/Products/filter-options')
      .then((res) => res.data);
  },

  /** UC-09: Chi tiết sản phẩm */
  getProductDetail(id: number): Promise<ProductDetail> {
    return axiosClient
      .get<ProductDetail>(`/Products/${id}`)
      .then((res) => res.data);
  },

  /** UC-09: Sản phẩm liên quan */
  getRelatedProducts(id: number, count = 4): Promise<ProductListItem[]> {
    return axiosClient
      .get<ProductListItem[]>(`/Products/${id}/related`, { params: { count } })
      .then((res) => res.data);
  },

  /** UC-10: Tìm kiếm sản phẩm AJAX */
  searchProducts(keyword: string, maxResults = 10): Promise<SearchProduct[]> {
    return axiosClient
      .get<SearchProduct[]>('/Products/search', {
        params: { keyword, maxResults },
      })
      .then((res) => res.data);
  },
};

export default productApi;
