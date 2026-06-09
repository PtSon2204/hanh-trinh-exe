import axiosClient, { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import type { BaseProduct3DConfigDto, BaseProductDto, CreateDesignRequest, IconDto, PrintAreaRect, PrintPlane3DConfig, ProductPrintArea } from '../types';

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
    threeDConfig?: BaseProduct3DConfigResponse | null;
    ThreeDConfig?: BaseProduct3DConfigResponse | null;
};

type BaseProduct3DConfigResponse = Partial<BaseProduct3DConfigDto> & {
    BaseProduct3DConfigId?: number;
    ModelUrl?: string;
    CenterOffsetJson?: string;
    FrontPrintPlaneJson?: string | null;
    BackPrintPlaneJson?: string | null;
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

const isNumberTuple = (value: unknown, length: number): value is number[] =>
    Array.isArray(value) && value.length === length && value.every((item) => typeof item === 'number' && Number.isFinite(item));

const readFiniteNumber = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const TSHIRT_OLD_MODEL_URL = '/models/base-products/tshirt_operational.glb';
const TSHIRT_AUTHORED_MODEL_URL = '/models/base-products/tshirt_operational_v1.1.glb';
const TSHIRT_AUTHORED_TEXTURE_REPEAT: [number, number] = [1.3, 1.1];
const TSHIRT_AUTHORED_FRONT_TEXTURE_OFFSET: [number, number] = [0.28, 0.11];
const TSHIRT_AUTHORED_BACK_TEXTURE_OFFSET: [number, number] = [-0.32, 0.1];

const normalize3DModelUrl = (modelUrl: string) =>
    modelUrl === TSHIRT_OLD_MODEL_URL ? TSHIRT_AUTHORED_MODEL_URL : modelUrl;

const withTShirtAuthoredDefaults = (
    plane: PrintPlane3DConfig | null,
    offset: [number, number],
): PrintPlane3DConfig | null => {
    if (!plane) return null;
    return {
        ...plane,
        authoredTextureOffset: plane.authoredTextureOffset ?? offset,
        authoredTextureRepeat: plane.authoredTextureRepeat ?? TSHIRT_AUTHORED_TEXTURE_REPEAT,
    };
};

const readRenderMode = (value: unknown): PrintPlane3DConfig['renderMode'] | undefined =>
    value === 'plane' || value === 'sampledDepth' ? value : undefined;

const parseNumberTuple = (json?: string | null): [number, number, number] | null => {
    if (!json) return null;
    try {
        const parsed: unknown = JSON.parse(json);
        return isNumberTuple(parsed, 3) ? [parsed[0], parsed[1], parsed[2]] : null;
    } catch {
        return null;
    }
};

const parsePrintPlaneJson = (json?: string | null): PrintPlane3DConfig | null => {
    if (!json) return null;
    try {
        const parsed: unknown = JSON.parse(json);
        if (!parsed || typeof parsed !== 'object') return null;
        const source = parsed as Record<string, unknown>;
        if (!isNumberTuple(source.position, 3) || !isNumberTuple(source.rotation, 3) || !isNumberTuple(source.size, 2)) return null;
        return {
            position: [source.position[0], source.position[1], source.position[2]],
            rotation: [source.rotation[0], source.rotation[1], source.rotation[2]],
            size: [source.size[0], source.size[1]],
            renderMode: readRenderMode(source.renderMode),
            segments: isNumberTuple(source.segments, 2) ? [source.segments[0], source.segments[1]] : undefined,
            projectionDirection: isNumberTuple(source.projectionDirection, 3)
                ? [source.projectionDirection[0], source.projectionDirection[1], source.projectionDirection[2]]
                : undefined,
            maxProjectionDistance: readFiniteNumber(source.maxProjectionDistance),
            surfaceOffset: readFiniteNumber(source.surfaceOffset),
            projectionStrength: readFiniteNumber(source.projectionStrength),
            fallbackBend: readFiniteNumber(source.fallbackBend),
            smoothIterations: readFiniteNumber(source.smoothIterations),
            authoredTextureOffset: isNumberTuple(source.authoredTextureOffset, 2)
                ? [source.authoredTextureOffset[0], source.authoredTextureOffset[1]]
                : undefined,
            authoredTextureRepeat: isNumberTuple(source.authoredTextureRepeat, 2)
                ? [source.authoredTextureRepeat[0], source.authoredTextureRepeat[1]]
                : undefined,
        };
    } catch {
        return null;
    }
};

const mapBaseProduct3DConfig = (config?: BaseProduct3DConfigResponse | null): BaseProduct3DConfigDto | null => {
    if (!config) return null;
    const modelUrl = normalize3DModelUrl(config.modelUrl ?? config.ModelUrl ?? '');
    const centerOffsetJson = config.centerOffsetJson ?? config.CenterOffsetJson ?? '';
    const frontPrintPlaneJson = config.frontPrintPlaneJson ?? config.FrontPrintPlaneJson ?? null;
    const backPrintPlaneJson = config.backPrintPlaneJson ?? config.BackPrintPlaneJson ?? null;
    if (!modelUrl || !centerOffsetJson) return null;
    const frontPrintPlane = parsePrintPlaneJson(frontPrintPlaneJson);
    const backPrintPlane = parsePrintPlaneJson(backPrintPlaneJson);
    const isAuthoredTShirt = modelUrl === TSHIRT_AUTHORED_MODEL_URL;
    return {
        baseProduct3DConfigId: config.baseProduct3DConfigId ?? config.BaseProduct3DConfigId,
        modelUrl,
        centerOffsetJson,
        frontPrintPlaneJson,
        backPrintPlaneJson,
        centerOffset: parseNumberTuple(centerOffsetJson),
        frontPrintPlane: isAuthoredTShirt
            ? withTShirtAuthoredDefaults(frontPrintPlane, TSHIRT_AUTHORED_FRONT_TEXTURE_OFFSET)
            : frontPrintPlane,
        backPrintPlane: isAuthoredTShirt
            ? withTShirtAuthoredDefaults(backPrintPlane, TSHIRT_AUTHORED_BACK_TEXTURE_OFFSET)
            : backPrintPlane,
    };
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
        threeDConfig: mapBaseProduct3DConfig(p.threeDConfig ?? p.ThreeDConfig),
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
