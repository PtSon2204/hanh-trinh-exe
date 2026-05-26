import axiosClient from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import type {
	AdminCreateOrderDto,
	AdminOrderDto,
	AdminOrderFabricPrintFileUploadDto,
	AdminOrderListDto,
	AdminOrderPrintFileDto,
	AdminOrderStatisticDto,
	AdminOrderStatisticQuery,
	AdminOrderStatusUpdateResponse,
	AdminUpdateOrderStatusDto,
} from "../types/adminOrder";

export const adminOrderApi = {
	resolvePrintFileUrl(printFileUrl: string) {
		return new URL(printFileUrl, axiosClient.defaults.baseURL).href;
	},

	getOrders(pageNumber = 1, pageSize = 10) {
		return axiosClient
			.get<PagedResult<AdminOrderListDto>>("/admin/orders", {
				params: { pageNumber, pageSize },
			})
			.then((res) => res.data);
	},

	getOrderById(id: number) {
		return axiosClient
			.get<AdminOrderDto>(`/admin/orders/${id}`)
			.then((res) => res.data);
	},

	createOrder(body: AdminCreateOrderDto) {
		return axiosClient
			.post<AdminOrderDto>("/admin/orders", body)
			.then((res) => res.data);
	},

	updateStatus(id: number, body: AdminUpdateOrderStatusDto) {
		return axiosClient
			.put<AdminOrderStatusUpdateResponse>(`/admin/orders/${id}/status`, body)
			.then((res) => res.data);
	},

	getStatistics(params: AdminOrderStatisticQuery) {
		return axiosClient
			.get<AdminOrderStatisticDto[]>("/admin/orders/statistics", { params })
			.then((res) => res.data);
	},

	exportPrintFiles(orderId: number) {
		return axiosClient
			.post<AdminOrderPrintFileDto[]>(`/admin/orders/${orderId}/print-files`)
			.then((res) => res.data);
	},

	saveFabricPrintFiles(orderId: number, body: AdminOrderFabricPrintFileUploadDto) {
		return axiosClient
			.post<AdminOrderPrintFileDto[]>(`/admin/orders/${orderId}/fabric-print-files`, body)
			.then((res) => res.data);
	},
};
