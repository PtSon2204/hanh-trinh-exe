import axiosClient from '../../../shared/api/axiosClient';
import type { BaseProductDto, IconDto, CreateDesignRequest } from '../types';

// Phôi áo fallback (chỉ dùng khi DB trả về rỗng hoặc lỗi)
const FALLBACK_BASE_PRODUCT: BaseProductDto = {
    baseProductId: 1,
    name: "Áo Phông",
    basePrice: 150000,
    frontImageUrl: "/images/Phoi_ao/áo cộc tay ko cổ.jpg",
    availableColors: "#FFFFFF,#000000,#9ca3af,#f9a8d4,#dbeafe,#4ade80,#c084fc,#fde047,#f97316,#dc2626"
};

export const customizerApi = {
    // ─── Lấy danh sách phôi áo từ DB ─────────────────────────────────────────
    getBaseProducts: async (): Promise<BaseProductDto[]> => {
        try {
            const res = await axiosClient.get('/Admin/BaseProduct', {
                params: { pageSize: 50, pageNumber: 1, isActive: true }
            });
            const data = res.data;

            // BE trả về PagedResult<BaseProductListDto> → { data: [...], pageNumber, pageSize, ... }
            let products: any[] = [];
            if (Array.isArray(data)) {
                products = data;
            } else if (data?.data && Array.isArray(data.data)) {
                products = data.data;               // PagedResult.Data (JSON camelCase → data)
            } else if (data?.Data && Array.isArray(data.Data)) {
                products = data.Data;               // PascalCase fallback
            } else if (data?.items && Array.isArray(data.items)) {
                products = data.items;
            }

            // Chỉ lấy những phôi active
            const active = products.filter((p: any) => p.isActive !== false);

            if (active.length === 0) {
                console.warn('[customizerApi] DB trả về 0 phôi áo active, dùng fallback.');
                return [FALLBACK_BASE_PRODUCT];
            }

            // Map sang interface FE
            return active.map((p: any): BaseProductDto => ({
                baseProductId: p.baseProductId ?? p.BaseProductId,
                name: p.name ?? p.Name,
                basePrice: p.basePrice ?? p.BasePrice ?? 150000,
                frontImageUrl: p.frontImageUrl ?? p.FrontImageUrl ?? FALLBACK_BASE_PRODUCT.frontImageUrl,
                backImageUrl: p.backImageUrl ?? p.BackImageUrl ?? undefined,
                availableColors: p.availableColors ?? p.AvailableColors ?? '#FFFFFF,#000000',
            }));
        } catch (err) {
            console.error('[customizerApi] Không thể tải phôi áo từ DB:', err);
            return [FALLBACK_BASE_PRODUCT];
        }
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