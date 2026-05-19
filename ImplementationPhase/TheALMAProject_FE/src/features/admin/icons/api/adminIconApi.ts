import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
  AdminIconDto,
  AdminIconListDto,
  AdminIconMutationDto,
  AdminIconMutationResponse,
  AdminIconQuery,
} from "../types/adminIcon";

function toIconFormData(body: AdminIconMutationDto) {
  const formData = new FormData();
  formData.append("Name", body.name);
  formData.append("PriceAddon", String(body.priceAddon));
  formData.append("Category", body.category);
  formData.append("IsActive", String(body.isActive));

  if (body.imageFile) {
    formData.append("ImageFile", body.imageFile);
  }

  return formData;
}

export const adminIconApi = {
  getIcons(params: AdminIconQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminIconListDto>>("/Admin/Icon", { params })
      .then((res) => res.data);
  },

  getIconById(id: number) {
    return axiosClient
      .get<AdminIconDto>(`/Admin/Icon/${id}`)
      .then((res) => res.data);
  },

  createIcon(body: AdminIconMutationDto) {
    return axiosClient
      .post<AdminIconMutationResponse>("/Admin/Icon", toIconFormData(body))
      .then((res) => res.data);
  },

  updateIcon(id: number, body: AdminIconMutationDto) {
    return axiosClient
      .put<AdminIconMutationResponse>(`/Admin/Icon/${id}`, toIconFormData(body))
      .then((res) => res.data);
  },

  deleteIcon(id: number) {
    return axiosClient
      .delete<AdminIconMutationResponse>(`/Admin/Icon/${id}`)
      .then((res) => res.data);
  },
};
