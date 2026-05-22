// src/features/cart/api/cartApi.ts
import axiosClient from '../../../shared/api/axiosClient';
import type { CartResponseDto } from '../types/index';

export const cartApi = {
  // Thêm sản phẩm vào giỏ hàng
  addToCart: async (data: { productId?: number; designId?: number; size: string; quantity: number }) => {
    const response = await axiosClient.post('/Cart/add', data);
    return response.data;
  },

  // Lấy toàn bộ giỏ hàng
  getMyCart: async () => {
    const response = await axiosClient.get<CartResponseDto>('/Cart/my-cart');
    return response.data;
  },

  // Cập nhật số lượng hoặc size
  updateCartItem: async (cartItemId: number, data: { quantity: number; size: string }) => {
    const response = await axiosClient.put(`/Cart/update-item/${cartItemId}`, data);
    return response.data;
  },

  // Xóa sản phẩm khỏi giỏ
  removeCartItem: async (cartItemId: number) => {
    const response = await axiosClient.delete(`/Cart/remove-item/${cartItemId}`);
    return response.data;
  },

  // Xoá toàn bộ giỏ hàng sau khi thanh toán
  clearCart: async () => {
    const response = await axiosClient.delete('/Cart/clear');
    return response.data;
  }
};