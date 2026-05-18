import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
  AdminBaseProductDto,
  AdminBaseProductListDto,
  AdminBaseProductMutationDto,
  AdminBaseProductQuery,
  AdminCreateStoreProductDto,
  AdminMutationResponse,
  AdminStoreProductDto,
  AdminStoreProductListDto,
  AdminStoreProductQuery,
  AdminUpdateStoreProductDto,
} from "../types/adminProduct";

interface ImageUploadResponse {
  imageUrl: string;
}

function uploadImage(path: string, file: File) {
  const body = new FormData();
  body.append("file", file);

  return axiosClient
    .post<ImageUploadResponse>(path, body)
    .then((res) => res.data.imageUrl);
}

export const adminProductApi = {
  getBaseProducts(params: AdminBaseProductQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminBaseProductListDto>>("/Admin/BaseProduct", {
        params,
      })
      .then((res) => res.data);
  },

  getBaseProductById(id: number) {
    return axiosClient
      .get<AdminBaseProductDto>(`/Admin/BaseProduct/${id}`)
      .then((res) => res.data);
  },

  createBaseProduct(body: AdminBaseProductMutationDto) {
    return axiosClient
      .post<AdminMutationResponse>("/Admin/BaseProduct", body)
      .then((res) => res.data);
  },

  updateBaseProduct(id: number, body: AdminBaseProductMutationDto) {
    return axiosClient
      .put<AdminMutationResponse>(`/Admin/BaseProduct/${id}`, body)
      .then((res) => res.data);
  },

  deleteBaseProduct(id: number) {
    return axiosClient
      .delete<AdminMutationResponse>(`/Admin/BaseProduct/${id}`)
      .then((res) => res.data);
  },

  uploadBaseProductImage(file: File) {
    return uploadImage("/Admin/BaseProduct/image", file);
  },

  getStoreProducts(params: AdminStoreProductQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminStoreProductListDto>>("/Admin/StoreProduct", {
        params,
      })
      .then((res) => res.data);
  },

  getStoreProductById(id: number) {
    return axiosClient
      .get<AdminStoreProductDto>(`/Admin/StoreProduct/${id}`)
      .then((res) => res.data);
  },

  createStoreProduct(body: AdminCreateStoreProductDto) {
    return axiosClient
      .post<AdminMutationResponse>("/Admin/StoreProduct", body)
      .then((res) => res.data);
  },

  updateStoreProduct(id: number, body: AdminUpdateStoreProductDto) {
    return axiosClient
      .put<AdminMutationResponse>(`/Admin/StoreProduct/${id}`, body)
      .then((res) => res.data);
  },

  deleteStoreProduct(id: number) {
    return axiosClient
      .delete<AdminMutationResponse>(`/Admin/StoreProduct/${id}`)
      .then((res) => res.data);
  },

  uploadStoreProductImage(file: File) {
    return uploadImage("/Admin/StoreProduct/image", file);
  },
};
