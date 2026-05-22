// src/features/user-designs/api/userDesignApi.ts
import axiosClient from '../../../shared/api/axiosClient';
import type { UserDesignResponseDto } from '../types/userDesign';

export const userDesignApi = {
  /** Lấy danh sách thiết kế của user đang đăng nhập */
  getMyDesigns: async (): Promise<UserDesignResponseDto[]> => {
    const res = await axiosClient.get<UserDesignResponseDto[]>('/UserDesign/my-designs');
    return res.data;
  },

  /** Xoá thiết kế theo ID */
  deleteDesign: async (designId: number): Promise<void> => {
    await axiosClient.delete(`/UserDesign/${designId}`);
  },
};
