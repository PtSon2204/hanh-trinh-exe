import axiosClient, { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import type { BaseProductDto, CreateDesignRequest, IconDto, PrintAreaRect, ProductPrintArea } from '../types';

type PagedResponse<T> = {
    data?: T[];
    Data?: T[];
    items?: T[];
};

type BaseProductResponse = Partial<BaseProductDto> & {
    BaseProductId?: number;
    Name?: string;
    BasePrice?: number;
    FrontImageUrl?: string;
    BackImageUrl?: string;
    AvailableColors?: string;
    PrintAreaJson?: string | null;
    printAreaJson?: string | null;
    isActive?: boolean;
    IsActive?: boolean;
};

const isPrintAreaRect = (value: unknown): value is PrintAreaRect => {
    if (!value || typeof value !== 'object') return false;
    const rect = value as Record<string, unknown>;
    return ['x', 'y', 'width', 'height'].every((key) => typeof rect[key] === 'number' && Number.isFinite(rect[key]));
};

const parsePrintAreaJson = (json?: string | null): ProductPrintArea | null => {
    if (!json) return null;
    try {
        const parsed: unknown = JSON.parse(json);
        if (!parsed || typeof parsed !== 'object') return null;
        const source = parsed as Record<string, unknown>;
        const front = isPrintAreaRect(source.front) ? source.front : undefined;
        const back = isPrintAreaRect(source.back) ? source.back : undefined;
        if (!front && !back) return null;
        return { front, back };
    } catch {
        return null;
    }
};

const readCollection = <T>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (!payload || typeof payload !== 'object') return [];

    const response = payload as PagedResponse<T>;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.Data)) return response.Data;
    if (Array.isArray(response.items)) return response.items;

    return [];
};

const mapBaseProduct = (p: BaseProductResponse): BaseProductDto => {
    const printAreaJson = p.printAreaJson ?? p.PrintAreaJson ?? null;
    return {
        baseProductId: p.baseProductId ?? p.BaseProductId,
        name: p.name ?? p.Name,
        basePrice: p.basePrice ?? p.BasePrice ?? 150000,
        frontImageUrl: p.frontImageUrl ?? p.FrontImageUrl ?? '',
        backImageUrl: p.backImageUrl ?? p.BackImageUrl ?? undefined,
        availableColors: p.availableColors ?? p.AvailableColors ?? '#FFFFFF,#000000',
        printAreaJson,
        printArea: parsePrintAreaJson(printAreaJson),
    };
};

const loadBaseProductDetail = async (productId: number): Promise<BaseProductResponse | null> => {
    try {
        const res = await axiosClient.get(`/Admin/BaseProduct/${productId}`);
        return res.data as BaseProductResponse;
    } catch (err) {
        console.warn(`[customizerApi] Không thể tải chi tiết phôi áo ${productId}:`, err);
        return null;
    }
};

// Phôi áo fallback đã bị xóa — khi DB trả về rỗng, UI sẽ hiển thị thông báo "Không có phôi áo nào"

export const customizerApi = {
    // ─── Lấy danh sách phôi áo từ DB ─────────────────────────────────────────
    getBaseProducts: async (): Promise<BaseProductDto[]> => {
        try {
            const res = await axiosClient.get('/Admin/BaseProduct', {
                params: { pageSize: 50, pageNumber: 1, isActive: true }
            });
            const data = res.data;

            // BE trả về PagedResult<BaseProductListDto> → { data: [...], pageNumber, pageSize, ... }
            const products = readCollection<BaseProductResponse>(data);

            // Chỉ lấy những phôi active
            const active = products.filter((p) => (p.isActive ?? p.IsActive) !== false);

            if (active.length === 0) {
                console.warn('[customizerApi] DB trả về 0 phôi áo active.');
                return [];
            }

            // BE list cũ có thể chưa trả printAreaJson, nên hydrate từ detail endpoint.
            const productsWithPrintArea = await Promise.all(active.map(async (p) => {
                const product = mapBaseProduct(p);
                if (product.printAreaJson || !product.baseProductId) return product;

                const detail = await loadBaseProductDetail(product.baseProductId);
                return detail ? mapBaseProduct({ ...p, ...detail }) : product;
            }));

            return productsWithPrintArea;
        } catch (err) {
            console.error('[customizerApi] Không thể tải phôi áo từ DB:', err);
            return [];
        }
    },

    // ─── Lấy icons từ DB ─────────────────────────────────────────────────────
    getIcons: async (): Promise<IconDto[]> => {
        try {
            const res = await axiosClient.get('/Icon/all');
            const data = res.data;
            const icons = readCollection<IconDto>(data);
            return icons.map((icon) => ({
                ...icon,
                imageUrl: resolveApiAssetUrl(icon.imageUrl) ?? icon.imageUrl,
            }));
        } catch (err) {
            console.error('Không thể tải icons từ server:', err);
            return [];
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
