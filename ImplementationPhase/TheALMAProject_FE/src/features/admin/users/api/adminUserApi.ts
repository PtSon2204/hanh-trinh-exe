import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
  AdminAssignRoleDto,
  AdminCreateUserDto,
  AdminUpdateUserDto,
  AdminUserDto,
  AdminUserListDto,
  AdminUserMutationResponse,
  AdminUserQuery,
} from "../types/adminUser";

const adminUserPath = "/Admin/User";

export const adminUserApi = {
  getUsers(params: AdminUserQuery = {}) {
    return axiosClient
      .get<PagedResult<AdminUserListDto>>(adminUserPath, { params })
      .then((res) => res.data);
  },

  getUserById(id: number) {
    return axiosClient
      .get<AdminUserDto>(`${adminUserPath}/${id}`)
      .then((res) => res.data);
  },

  createUser(body: AdminCreateUserDto) {
    return axiosClient
      .post<AdminUserMutationResponse>(adminUserPath, body)
      .then((res) => res.data);
  },

  updateUser(id: number, body: AdminUpdateUserDto) {
    return axiosClient
      .put<AdminUserMutationResponse>(`${adminUserPath}/${id}`, body)
      .then((res) => res.data);
  },

  uploadAvatar(id: number, file: File) {
    const body = new FormData();
    body.append("file", file);

    return axiosClient
      .post<AdminUserMutationResponse>(`${adminUserPath}/${id}/avatar`, body)
      .then((res) => res.data);
  },

  assignRole(id: number, body: AdminAssignRoleDto) {
    return axiosClient
      .put<AdminUserMutationResponse>(`${adminUserPath}/${id}/assign-role`, body)
      .then((res) => res.data);
  },

  deactivateUser(id: number) {
    return axiosClient
      .delete<AdminUserMutationResponse>(`${adminUserPath}/${id}`)
      .then((res) => res.data);
  },
};
