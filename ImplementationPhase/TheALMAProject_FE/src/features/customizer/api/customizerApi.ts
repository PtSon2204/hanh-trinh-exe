import axiosClient, { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import type { BaseProduct3DConfigDto, BaseProductDto, CreateDesignRequest, CustomizerImageUploadResponse, IconDto, PrintAreaRect, PrintPlane3DConfig, ProductPrintArea } from '../types';

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
const POLO_AUTHORED_MODEL_URL = '/models/base-products/polo_operation_v1.1.glb';
const TSHIRT_AUTHORED_TEXTURE_REPEAT: [number, number] = [1.3, 1.1];
const TSHIRT_AUTHORED_FRONT_TEXTURE_OFFSET: [number, number] = [0.28, 0.11];
const TSHIRT_AUTHORED_BACK_TEXTURE_OFFSET: [number, number] = [-0.32, 0.1];

const TSHIRT_FRONT_PRINT_PLANE: PrintPlane3DConfig = {
    position: [0, -620, 119],
    rotation: [0, 0, 0],
    size: [1150, 1438],
    renderMode: 'sampledDepth',
    segments: [24, 32],
    projectionDirection: [0, 0, -1],
    maxProjectionDistance: 320,
    surfaceOffset: 1.8,
    projectionStrength: 0.68,
    fallbackBend: 0.08,
    smoothIterations: 1,
    authoredTextureOffset: TSHIRT_AUTHORED_FRONT_TEXTURE_OFFSET,
    authoredTextureRepeat: TSHIRT_AUTHORED_TEXTURE_REPEAT,
};

const TSHIRT_BACK_PRINT_PLANE: PrintPlane3DConfig = {
    position: [0, -620, -179],
    rotation: [0, Math.PI, 0],
    size: [1150, 1438],
    renderMode: 'sampledDepth',
    segments: [24, 32],
    projectionDirection: [0, 0, 1],
    maxProjectionDistance: 320,
    surfaceOffset: 1.2,
    projectionStrength: 0.68,
    fallbackBend: 0.08,
    smoothIterations: 1,
    authoredTextureOffset: TSHIRT_AUTHORED_BACK_TEXTURE_OFFSET,
    authoredTextureRepeat: TSHIRT_AUTHORED_TEXTURE_REPEAT,
};

const POLO_FRONT_PRINT_PLANE: PrintPlane3DConfig = {
    position: [0, -700, 255],
    rotation: [0, 0, 0],
    size: [640, 860],
    renderMode: 'sampledDepth',
    segments: [36, 48],
    projectionDirection: [0, 0, -1],
    maxProjectionDistance: 760,
    surfaceOffset: 1.4,
    projectionStrength: 0.82,
    fallbackBend: 0.035,
    smoothIterations: 2,
};

const POLO_BACK_PRINT_PLANE: PrintPlane3DConfig = {
    position: [0, -700, -285],
    rotation: [0, Math.PI, 0],
    size: [680, 900],
    renderMode: 'sampledDepth',
    segments: [36, 48],
    projectionDirection: [0, 0, 1],
    maxProjectionDistance: 760,
    surfaceOffset: 1.4,
    projectionStrength: 0.82,
    fallbackBend: 0.035,
    smoothIterations: 2,
};

const normalize3DModelUrl = (modelUrl: string) =>
    modelUrl === TSHIRT_OLD_MODEL_URL ? TSHIRT_AUTHORED_MODEL_URL : modelUrl;

const getDefaultPrintPlanes = (modelUrl: string) => {
    if (modelUrl === POLO_AUTHORED_MODEL_URL) {
        return { front: POLO_FRONT_PRINT_PLANE, back: POLO_BACK_PRINT_PLANE };
    }

    return { front: TSHIRT_FRONT_PRINT_PLANE, back: TSHIRT_BACK_PRINT_PLANE };
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

const parsePrintPlaneJson = (json?: string | null, fallback?: PrintPlane3DConfig): PrintPlane3DConfig | null => {
    try {
        const parsed: unknown = json ? JSON.parse(json) : {};
        if (!parsed || typeof parsed !== 'object') return null;
        const source = parsed as Record<string, unknown>;
        if (!fallback && (!isNumberTuple(source.position, 3) || !isNumberTuple(source.rotation, 3) || !isNumberTuple(source.size, 2))) return null;
        const position = isNumberTuple(source.position, 3)
            ? [source.position[0], source.position[1], source.position[2]] as [number, number, number]
            : fallback?.position;
        const rotation = isNumberTuple(source.rotation, 3)
            ? [source.rotation[0], source.rotation[1], source.rotation[2]] as [number, number, number]
            : fallback?.rotation;
        const size = isNumberTuple(source.size, 2)
            ? [source.size[0], source.size[1]] as [number, number]
            : fallback?.size;

        if (!position || !rotation || !size) return null;

        return {
            position,
            rotation,
            size,
            renderMode: readRenderMode(source.renderMode) ?? fallback?.renderMode,
            segments: isNumberTuple(source.segments, 2) ? [source.segments[0], source.segments[1]] : fallback?.segments,
            projectionDirection: isNumberTuple(source.projectionDirection, 3)
                ? [source.projectionDirection[0], source.projectionDirection[1], source.projectionDirection[2]]
                : fallback?.projectionDirection,
            maxProjectionDistance: readFiniteNumber(source.maxProjectionDistance) ?? fallback?.maxProjectionDistance,
            surfaceOffset: readFiniteNumber(source.surfaceOffset) ?? fallback?.surfaceOffset,
            projectionStrength: readFiniteNumber(source.projectionStrength) ?? fallback?.projectionStrength,
            fallbackBend: readFiniteNumber(source.fallbackBend) ?? fallback?.fallbackBend,
            smoothIterations: readFiniteNumber(source.smoothIterations) ?? fallback?.smoothIterations,
            authoredTextureOffset: isNumberTuple(source.authoredTextureOffset, 2)
                ? [source.authoredTextureOffset[0], source.authoredTextureOffset[1]]
                : fallback?.authoredTextureOffset,
            authoredTextureRepeat: isNumberTuple(source.authoredTextureRepeat, 2)
                ? [source.authoredTextureRepeat[0], source.authoredTextureRepeat[1]]
                : fallback?.authoredTextureRepeat,
        };
    } catch {
        return fallback ?? null;
    }
};

const mapBaseProduct3DConfig = (config?: BaseProduct3DConfigResponse | null): BaseProduct3DConfigDto | null => {
    if (!config) return null;
    const modelUrl = normalize3DModelUrl(config.modelUrl ?? config.ModelUrl ?? '');
    const centerOffsetJson = config.centerOffsetJson ?? config.CenterOffsetJson ?? '';
    const frontPrintPlaneJson = config.frontPrintPlaneJson ?? config.FrontPrintPlaneJson ?? null;
    const backPrintPlaneJson = config.backPrintPlaneJson ?? config.BackPrintPlaneJson ?? null;
    if (!modelUrl || !centerOffsetJson) return null;
    const defaultPrintPlanes = getDefaultPrintPlanes(modelUrl);
    const frontPrintPlane = parsePrintPlaneJson(frontPrintPlaneJson, defaultPrintPlanes.front);
    const backPrintPlane = parsePrintPlaneJson(backPrintPlaneJson, defaultPrintPlanes.back);
    return {
        baseProduct3DConfigId: config.baseProduct3DConfigId ?? config.BaseProduct3DConfigId,
        modelUrl,
        centerOffsetJson,
        frontPrintPlaneJson,
        backPrintPlaneJson,
        centerOffset: parseNumberTuple(centerOffsetJson),
        frontPrintPlane,
        backPrintPlane,
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

            // Hydrate detail because the customizer needs the freshest print area and 3D tuning JSON.
            const productsWithPrintArea = await Promise.all(active.map(async (p) => {
                const product = mapBaseProduct(p);
                if (!product.baseProductId) return product;

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

    // ─── Upload ảnh customizer khi người dùng thật sự lưu thiết kế ─────────────
    uploadCustomizerImage: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await axiosClient.post<CustomizerImageUploadResponse>('/UserDesign/upload-image', formData);
        return resolveApiAssetUrl(res.data.imageUrl) ?? res.data.imageUrl;
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
