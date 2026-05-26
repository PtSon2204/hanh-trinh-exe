import axiosClient from '../../../shared/api/axiosClient';
import type { PagedResult } from '../../../shared/types/pagination';
import type { OrderResponseDto, OrderQuery, OrderDetailResponseDto } from '../types';

export const orderApi = {
  // Hàm lấy danh sách đơn hàng
  getMyOrders: async (params: OrderQuery) => {
    // Gọi method GET tới endpoint /api/Order/my-orders
    const response = await axiosClient.get<PagedResult<OrderResponseDto>>('/Order/my-orders', { params });
    return response.data; // Chỉ lấy phần data trả về
  },

  // Hàm lấy chi tiết đơn hàng (Dành cho trang sau)
  getOrderDetail: async (orderId: number) => {
    const response = await axiosClient.get<OrderDetailResponseDto>(`/Order/${orderId}`);
    return response.data;
  },

  // Hàm hủy đơn hàng
  cancelOrder: async (orderId: number, refundData?: { refundBankName?: string; refundAccountNumber?: string; refundAccountName?: string }) => {
    const response = await axiosClient.patch(`/Order/${orderId}/cancel`, refundData);
    return response.data;
  },

  // Hàm cập nhật địa chỉ giao hàng
  updateShippingAddress: async (orderId: number, data: { shipName: string; shipPhone: string; shipAddress: string; shipProvince: string }) => {
    const response = await axiosClient.patch(`/Order/${orderId}/address`, data);
    return response.data;
  }
};