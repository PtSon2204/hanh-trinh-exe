import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type { AdminUniversityDto, AdminUniversityListDto } from "../types/adminUniversity";

interface AdminUniversityQuery {
  pageNumber?: number;
  pageSize?: number;
  name?: string;
  isActive?: boolean;
}

export const adminUniversityApi = {
  getUniversities(params: AdminUniversityQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminUniversityListDto>>("/Admin/University", { params })
      .then((res) => res.data);
  },

  getUniversityById(id: number) {
    return axiosClient
      .get<AdminUniversityDto>(`/Admin/University/${id}`)
      .then((res) => res.data);
  },
};
