import axiosClient from '../../../shared/api/axiosClient';
import type { BaseProductDto, IconDto, CreateDesignRequest } from '../types';

export const customizerApi = {
    // ─── Lấy danh sách phôi áo ───────────────────────────────────────────────
    getBaseProducts: async (): Promise<BaseProductDto[]> => {
        return [
            {
                baseProductId: 1,
                name: "Áo phông",
                basePrice: 150000,
                frontImageUrl: "/images/Phoi_ao/áo cộc tay ko cổ.jpg",
                availableColors: "#FFFFFF,#000000,#9ca3af,#f9a8d4,#dbeafe,#4ade80,#c084fc,#fde047,#f97316,#dc2626"
            },
            {
                baseProductId: 2,
                name: "Áo Polo",
                basePrice: 180000,
                frontImageUrl: "/images/Phoi_ao/áo cộc tay có cổ.jpg",
                availableColors: "#FFFFFF,#000000,#9ca3af,#f9a8d4,#dbeafe,#4ade80,#c084fc,#fde047,#f97316,#dc2626"
            }
        ];
    },

    // ─── Lấy icons từ DB ─────────────────────────────────────────────────────
    getIcons: async (): Promise<IconDto[]> => {
        try {
            const res = await axiosClient.get('/Icon/all');
            const data = res.data;
            let icons: IconDto[] = [];
            if (Array.isArray(data)) icons = data;
            else if (data?.items && Array.isArray(data.items)) icons = data.items;
            
            if (icons.length === 0) {
                return [
                    { iconId: 101, name: "Sticker 1", imageUrl: "/images/stickers/1.png", priceAddon: 5000 },
                    { iconId: 102, name: "Sticker 2", imageUrl: "/images/stickers/2.png", priceAddon: 5000 },
                    { iconId: 103, name: "Sticker 3", imageUrl: "/images/stickers/3.png", priceAddon: 5000 },
                    { iconId: 104, name: "Sticker 4", imageUrl: "/images/stickers/4.png", priceAddon: 5000 },
                    { iconId: 105, name: "Sticker 5", imageUrl: "/images/stickers/5.png", priceAddon: 5000 }
                ];
            }
            return icons;
        } catch (err) {
            console.error('Không thể tải icons từ server:', err);
            return [
                { iconId: 101, name: "Sticker 1", imageUrl: "/images/stickers/1.png", priceAddon: 5000 },
                { iconId: 102, name: "Sticker 2", imageUrl: "/images/stickers/2.png", priceAddon: 5000 },
                { iconId: 103, name: "Sticker 3", imageUrl: "/images/stickers/3.png", priceAddon: 5000 },
                { iconId: 104, name: "Sticker 4", imageUrl: "/images/stickers/4.png", priceAddon: 5000 },
                { iconId: 105, name: "Sticker 5", imageUrl: "/images/stickers/5.png", priceAddon: 5000 }
            ];
        }
    },

    // ─── Lưu thiết kế lên server ─────────────────────────────────────────────
    saveDesign: async (payload: CreateDesignRequest): Promise<{ message: string; designId: number }> => {
        const res = await axiosClient.post('/UserDesign', payload);
        return res.data;
    },

    // ─── Lưu design rồi thêm nhiều size cùng lúc ─────────────────────────────
    saveAndAddMultiSize: async (
        payload: CreateDesignRequest,
        sizeQty: Record<string, number>  // VD: { S: 2, M: 3, XL: 1 }
    ): Promise<void> => {
        // 1. Lưu thiết kế → lấy designId
        const saveRes = await axiosClient.post('/UserDesign', payload);
        console.log('[saveAndAddMultiSize] saveRes.data:', saveRes.data);
        const designId: number = saveRes.data?.designId ?? saveRes.data?.DesignId;
        if (!designId) throw new Error('Không lấy được designId sau khi lưu thiết kế.');

        // 2. Build danh sách size có qty > 0
        const items = Object.entries(sizeQty)
            .filter(([, qty]) => qty > 0)
            .map(([size, quantity]) => ({ size, quantity }));

        if (items.length === 0) throw new Error('Vui lòng chọn ít nhất 1 size.');

        // 3. Gọi add-multi một lần duy nhất
        await axiosClient.post('/Cart/add-multi', { designId, items });
    },
};