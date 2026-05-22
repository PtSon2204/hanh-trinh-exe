import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
  AdminUserDesignDto,
  AdminUserDesignListDto,
  AdminUserDesignMutationResponse,
  AdminUserDesignQuery,
} from "../types/adminUserDesign";

export const adminUserDesignApi = {
  getUserDesigns(params: AdminUserDesignQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminUserDesignListDto>>("/admin/user-designs", { params })
      .then((res) => res.data);
  },

  getUserDesignById(id: number) {
    return axiosClient
      .get<AdminUserDesignDto>(`/admin/user-designs/${id}`)
      .then((res) => res.data);
  },

  deleteUserDesign(id: number) {
    return axiosClient
      .delete<AdminUserDesignMutationResponse>(`/admin/user-designs/${id}`)
      .then((res) => res.data);
  },
};
