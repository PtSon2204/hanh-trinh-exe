import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
	AdminVoucherListDto,
	AdminVoucherDto,
	AdminCreateVoucherDto,
	AdminUpdateVoucherDto,
	AdminVoucherQuery,
} from "../types/adminVoucher";

export const adminVoucherApi = {
	getVouchers(params: AdminVoucherQuery) {
		return axiosClient
			.get<PagedResult<AdminVoucherListDto>>("/Admin/Voucher", { params })
			.then((res) => res.data);
	},

	getVoucherById(id: number) {
		return axiosClient
			.get<AdminVoucherDto>(`/Admin/Voucher/${id}`)
			.then((res) => res.data);
	},

	createVoucher(body: AdminCreateVoucherDto) {
		return axiosClient
			.post<{ message: string }>("/Admin/Voucher", body)
			.then((res) => res.data);
	},

	updateVoucher(id: number, body: AdminUpdateVoucherDto) {
		return axiosClient
			.put<{ message: string }>(`/Admin/Voucher/${id}`, body)
			.then((res) => res.data);
	},

	deleteVoucher(id: number) {
		return axiosClient
			.delete<{ message: string }>(`/Admin/Voucher/${id}`)
			.then((res) => res.data);
	},
};
