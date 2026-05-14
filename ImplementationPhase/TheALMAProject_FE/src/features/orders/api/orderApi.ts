import axiosClient from '../../../shared/api/axiosClient';
import type { PagedResult } from '../../../shared/types/pagination';
import type { OrderResponseDto, OrderQuery } from '../types';

export const orderApi = {
  // Hàm lấy danh sách đơn hàng
  getMyOrders: async (params: OrderQuery) => {
    // Gọi method GET tới endpoint /api/Order/my-orders
    const response = await axiosClient.get<PagedResult<OrderResponseDto>>('/Order/my-orders', { params });
    return response.data; // Chỉ lấy phần data trả về
  },

  // Hàm lấy chi tiết đơn hàng (Dành cho trang sau)
  getOrderDetail: async (orderId: number) => {
    const response = await axiosClient.get<OrderResponseDto>(`/Order/${orderId}`);
    return response.data;
  }
};