import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { customizerApi } from '../api/customizerApi';
import { useAuth } from '../../auth/context/AuthContext';
import type { BaseProductDto, IconDto, PrintAreaRect } from '../types';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import './CustomizerPage.css';

type CanvasSide = 'front' | 'back';

type CanvasBounds = {
    left: number;
    top: number;
    width: number;
    height: number;
};

type FabricTransformEvent = fabric.IEvent & {
    transform?: {
        target?: fabric.Object;
    };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getFabricEventTarget = (event: FabricTransformEvent) => event.target ?? event.transform?.target;

const getPrintAreaOverlayStyle = (rect: PrintAreaRect | undefined) => {
    if (!rect || rect.width <= 0 || rect.height <= 0) {
        return { left: '0%', top: '0%', width: '100%', height: '100%' };
    }

    const x = clamp(rect.x, 0, 1);
    const y = clamp(rect.y, 0, 1);
    return {
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${clamp(rect.width, 0, 1 - x) * 100}%`,
        height: `${clamp(rect.height, 0, 1 - y) * 100}%`,
    };
};

const getCanvasFallbackBounds = (canvas: fabric.Canvas): CanvasBounds => ({
    left: 0,
    top: 0,
    width: canvas.getWidth(),
    height: canvas.getHeight(),
});

const getCanvasPrintBounds = (rect: PrintAreaRect | undefined, canvas: fabric.Canvas): CanvasBounds => {
    const fallback = getCanvasFallbackBounds(canvas);
    if (!rect || rect.width <= 0 || rect.height <= 0) return fallback;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const normalized = rect.x >= 0 && rect.x <= 1 && rect.y >= 0 && rect.y <= 1 && rect.width > 0 && rect.width <= 1 && rect.height > 0 && rect.height <= 1;

    const rawBounds = normalized
        ? {
            left: rect.x * canvasWidth,
            top: rect.y * canvasHeight,
            width: rect.width * canvasWidth,
            height: rect.height * canvasHeight,
        }
        : {
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
        };

    const left = clamp(rawBounds.left, 0, canvasWidth);
    const top = clamp(rawBounds.top, 0, canvasHeight);
    return {
        left,
        top,
        width: clamp(rawBounds.width, 1, canvasWidth - left || 1),
        height: clamp(rawBounds.height, 1, canvasHeight - top || 1),
    };
};

const clampObjectToBounds = (obj: fabric.Object | undefined, bounds: CanvasBounds, canvas: fabric.Canvas) => {
    if (!obj) return;
    obj.setCoords();
    const box = obj.getBoundingRect(true, true);
    const maxLeft = bounds.left + bounds.width - box.width;
    const maxTop = bounds.top + bounds.height - box.height;
    const targetLeft = clamp(box.left, bounds.left, Math.max(bounds.left, maxLeft));
    const targetTop = clamp(box.top, bounds.top, Math.max(bounds.top, maxTop));
    const deltaLeft = targetLeft - box.left;
    const deltaTop = targetTop - box.top;

    if (deltaLeft !== 0 || deltaTop !== 0) {
        obj.set({
            left: (obj.left ?? 0) + deltaLeft,
            top: (obj.top ?? 0) + deltaTop,
        });
        obj.setCoords();
        canvas.requestRenderAll();
    }
};

const clampObjectScaleToBounds = (obj: fabric.Object | undefined, bounds: CanvasBounds, canvas: fabric.Canvas) => {
    if (!obj) return;
    obj.setCoords();
    const box = obj.getBoundingRect(true, true);
    if (box.width > bounds.width || box.height > bounds.height) {
        const scaleLimit = Math.min(bounds.width / box.width, bounds.height / box.height);
        obj.scaleX = (obj.scaleX ?? 1) * scaleLimit;
        obj.scaleY = (obj.scaleY ?? 1) * scaleLimit;
        obj.setCoords();
    }
    clampObjectToBounds(obj, bounds, canvas);
};

export default function CustomizerPage() {
    const navigate = useNavigate(); 
    const { user } = useAuth();

    // --- Refs (Front) ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);

    // --- Refs (Back) ---
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const backWrapperRef = useRef<HTMLDivElement>(null);
    const backFabricCanvas = useRef<fabric.Canvas | null>(null);



    // --- States UI ---
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'base' | 'ai' | 'text'>('base');
    const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
    const [layersVisible, setLayersVisible] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedQty, setSelectedQty] = useState(1);

    // --- Danh sách Phôi Áo (load từ DB) ---
    const [baseProducts, setBaseProducts] = useState<BaseProductDto[]>([]);
    const [baseProductsLoading, setBaseProductsLoading] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const selectedProduct = baseProducts.find(p => p.baseProductId === selectedProductId) ?? baseProducts[0];
    const printAreaRef = useRef<BaseProductDto['printArea']>(null);


    // --- States Dữ liệu Thiết kế ---
    const [, setLayerTrigger] = useState(0);
    const [historyList, setHistoryList] = useState<any[]>([]);

    // --- States Icons từ DB ---
    const [icons, setIcons] = useState<IconDto[]>([]);
    const [iconsLoading, setIconsLoading] = useState(true);
    const [usedIconIds, setUsedIconIds] = useState<number[]>([]);

    // --- States Cart Modal ---
    const [cartModalOpen, setCartModalOpen] = useState(false);
    const [sizeQty, setSizeQty] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    // --- States AI ---
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<{
        concept: string;
        icons: { name: string; description: string; emoji: string }[];
        colors: { hex: string; name: string }[];
        texts: string[];
        style: string;
    } | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    // Helper: trả về canvas đang active (dùng sau khi states đã khởi tạo)
    const getActiveCanvas = () =>
        viewMode === 'front' ? fabricCanvas.current : backFabricCanvas.current;

    const getPrintAreaForSide = (side: CanvasSide) => printAreaRef.current?.[side];

    const constrainObject = (side: CanvasSide, obj: fabric.Object | undefined, canvas: fabric.Canvas, isScaling = false) => {
        const bounds = getCanvasPrintBounds(getPrintAreaForSide(side), canvas);
        if (isScaling) {
            clampObjectScaleToBounds(obj, bounds, canvas);
            return;
        }
        clampObjectToBounds(obj, bounds, canvas);
    };

    // 1. Khởi tạo Fabric.js Canvas (Front + Back)
    useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) return;
        if (!backCanvasRef.current || !backWrapperRef.current) return;

        const updateLayers = () => setLayerTrigger(prev => prev + 1);
        const constrainFrontMove = (event: FabricTransformEvent) => {
            if (fabricCanvas.current) {
                const bounds = getCanvasPrintBounds(printAreaRef.current?.front, fabricCanvas.current);
                clampObjectToBounds(getFabricEventTarget(event), bounds, fabricCanvas.current);
            }
        };
        const constrainFrontScale = (event: FabricTransformEvent) => {
            if (fabricCanvas.current) {
                const bounds = getCanvasPrintBounds(printAreaRef.current?.front, fabricCanvas.current);
                clampObjectScaleToBounds(getFabricEventTarget(event), bounds, fabricCanvas.current);
            }
        };
        const constrainBackMove = (event: FabricTransformEvent) => {
            if (backFabricCanvas.current) {
                const bounds = getCanvasPrintBounds(printAreaRef.current?.back, backFabricCanvas.current);
                clampObjectToBounds(getFabricEventTarget(event), bounds, backFabricCanvas.current);
            }
        };
        const constrainBackScale = (event: FabricTransformEvent) => {
            if (backFabricCanvas.current) {
                const bounds = getCanvasPrintBounds(printAreaRef.current?.back, backFabricCanvas.current);
                clampObjectScaleToBounds(getFabricEventTarget(event), bounds, backFabricCanvas.current);
            }
        };

        // ── FRONT canvas ──
        const w = wrapperRef.current.offsetWidth;
        const h = wrapperRef.current.offsetHeight;
        fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
            width: w, height: h,
            backgroundColor: 'transparent', selection: true,
        });
        const defaultText = new fabric.IText('A1 CLASS', {
            left: w / 2, top: h * 0.35,
            originX: 'center', originY: 'center',
            fontSize: 32, fontFamily: 'Impact', fontWeight: 'bold',
            fill: '#1e293b',
            cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
            transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
        });
        fabricCanvas.current.add(defaultText);
        fabricCanvas.current.setActiveObject(defaultText);
        fabricCanvas.current.on('object:added', updateLayers);
        fabricCanvas.current.on('object:removed', updateLayers);
        fabricCanvas.current.on('object:modified', updateLayers);
        fabricCanvas.current.on('object:moving', constrainFrontMove);
        fabricCanvas.current.on('object:scaling', constrainFrontScale);
        fabricCanvas.current.on('object:rotating', constrainFrontScale);
        fabricCanvas.current.on('object:modified', constrainFrontMove);

        // ── BACK canvas ──
        const bw = backWrapperRef.current.offsetWidth;
        const bh = backWrapperRef.current.offsetHeight;
        backFabricCanvas.current = new fabric.Canvas(backCanvasRef.current, {
            width: bw || w, height: bh || h,
            backgroundColor: 'transparent', selection: true,
        });
        backFabricCanvas.current.on('object:added', updateLayers);
        backFabricCanvas.current.on('object:removed', updateLayers);
        backFabricCanvas.current.on('object:modified', updateLayers);
        backFabricCanvas.current.on('object:moving', constrainBackMove);
        backFabricCanvas.current.on('object:scaling', constrainBackScale);
        backFabricCanvas.current.on('object:rotating', constrainBackScale);
        backFabricCanvas.current.on('object:modified', constrainBackMove);

        updateLayers();

        // Load History
        try {
            const saved = JSON.parse(localStorage.getItem('alma_design_history') || '[]');
            setHistoryList(saved);
        } catch { }

        // Handle Resize
        const handleResize = () => {
            if (fabricCanvas.current && wrapperRef.current) {
                fabricCanvas.current.setWidth(wrapperRef.current.offsetWidth);
                fabricCanvas.current.setHeight(wrapperRef.current.offsetHeight);
                fabricCanvas.current.renderAll();
            }
            if (backFabricCanvas.current && backWrapperRef.current) {
                backFabricCanvas.current.setWidth(backWrapperRef.current.offsetWidth);
                backFabricCanvas.current.setHeight(backWrapperRef.current.offsetHeight);
                backFabricCanvas.current.renderAll();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            fabricCanvas.current?.dispose();
            backFabricCanvas.current?.dispose();
        };
    }, []);

    useEffect(() => {
        printAreaRef.current = selectedProduct?.printArea ?? null;
        const frontCanvas = fabricCanvas.current;
        const backCanvas = backFabricCanvas.current;
        frontCanvas?.getObjects().forEach(obj => {
            const bounds = getCanvasPrintBounds(printAreaRef.current?.front, frontCanvas);
            clampObjectScaleToBounds(obj, bounds, frontCanvas);
        });
        backCanvas?.getObjects().forEach(obj => {
            const bounds = getCanvasPrintBounds(printAreaRef.current?.back, backCanvas);
            clampObjectScaleToBounds(obj, bounds, backCanvas);
        });
    }, [selectedProduct?.printArea]);

    // Load icons từ DB khi mount
    useEffect(() => {
        customizerApi.getIcons().then(data => {
            setIcons(data);
            setIconsLoading(false);
        });
    }, []);

    // Load phôi áo từ DB khi mount
    useEffect(() => {
        customizerApi.getBaseProducts().then(data => {
            setBaseProducts(data);
            if (data.length > 0) {
                setSelectedProductId(data[0].baseProductId);
            }
            setBaseProductsLoading(false);
        });
    }, []);

    // 2. Chức năng Thêm Chữ
    const handleAddText = () => {
        const ac = getActiveCanvas();
        if (!ac) return;
        const inputContent = (document.getElementById('text-content-input') as HTMLInputElement)?.value || 'Text mới';
        const font = (document.getElementById('text-font-select') as HTMLSelectElement)?.value || 'Arial';
        const size = parseInt((document.getElementById('text-size-input') as HTMLInputElement)?.value) || 28;
        const color = (document.getElementById('text-color-input') as HTMLInputElement)?.value || '#000000';

        const text = new fabric.IText(inputContent, {
            left: ac.width! / 2, top: ac.height! / 2,
            originX: 'center', originY: 'center',
            fontSize: size, fontFamily: font, fill: color,
            cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
            transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
        });
        ac.add(text);
        ac.setActiveObject(text);
        constrainObject(viewMode, text, ac, true);
    };

    // 3. Thêm Icon/Sticker lên canvas (track iconId)
    const handleAddIcon = (icon: IconDto) => {
        const ac = getActiveCanvas();
        if (!ac) return;
        const resolvedUrl = resolveApiAssetUrl(icon.imageUrl) || icon.imageUrl;
        fabric.Image.fromURL(resolvedUrl, (img) => {
            const maxSize = ac.width! * 0.5;
            const scale = maxSize / Math.max(img.width!, img.height!);
            (img as any)._priceAddon = icon.priceAddon; // lưu giá vào object để tính tiền
            img.set({
                left: ac.width! / 2, top: ac.height! / 2,
                originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale,
                selectable: true, evented: true,
                cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
                transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
            });
            ac.add(img);
            ac.setActiveObject(img);
            constrainObject(viewMode, img, ac, true);
            setUsedIconIds(prev => prev.includes(icon.iconId) ? prev : [...prev, icon.iconId]);
        }, { crossOrigin: 'anonymous' });
    };



    // 4. Các nút Toolbar nổi
    const handleFloatingAction = (action: string) => {
        const ac = getActiveCanvas();
        if (!ac) return;
        const obj = ac.getActiveObject();
        if (!obj) { toast.error("Vui lòng chọn 1 item!"); return; }

        switch (action) {
            case 'flip': obj.set('flipY', !obj.flipY); break;
            case 'center': obj.set({ left: ac.width! / 2, originX: 'center' }); constrainObject(viewMode, obj, ac); break;
            case 'down': ac.sendBackwards(obj); break;
            case 'up': ac.bringForward(obj); break;
            case 'delete': ac.remove(obj); break;
            case 'clone':
                obj.clone((cloned: fabric.Object) => {
                    cloned.set({ left: obj.left! + 20, top: obj.top! + 20 });
                    ac.add(cloned);
                    ac.setActiveObject(cloned);
                    constrainObject(viewMode, cloned, ac, true);
                    ac.renderAll();
                });
                break;
        }
        ac.renderAll();
    };

    // 5. Call Gemini AI để gợi ý thiết kế
    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) { toast.error('Vui lòng nhập mô tả ý tưởng!'); return; }
        setIsAiLoading(true);
        setAiSuggestion(null);
        setAiError(null);

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            setAiError('Chưa cấu hình Gemini API Key. Thêm VITE_GEMINI_API_KEY vào file .env rồi restart server.');
            setIsAiLoading(false);
            return;
        }

        const SYSTEM_PROMPT = `Bạn là chuyên gia thiết kế áo thun custom tại Việt Nam. Hãy gợi ý thiết kế áo in dựa trên ý tưởng của khách hàng.

Trả về ĐÚNG định dạng JSON sau (không thêm bất kỳ text nào khác, không có comment):
{
  "concept": "Mô tả concept thiết kế tổng thể 2-3 câu",
  "style": "Tên phong cách ví dụ: Streetwear",
  "icons": [
    { "name": "Tên họa tiết 1", "description": "Mô tả 1 câu", "emoji": "🎨" },
    { "name": "Tên họa tiết 2", "description": "Mô tả 1 câu", "emoji": "⚡" },
    { "name": "Tên họa tiết 3", "description": "Mô tả 1 câu", "emoji": "🔥" },
    { "name": "Tên họa tiết 4", "description": "Mô tả 1 câu", "emoji": "✨" }
  ],
  "colors": [
    { "hex": "#1a1a1a", "name": "Đen" },
    { "hex": "#dc2626", "name": "Đỏ" },
    { "hex": "#1d4ed8", "name": "Xanh dương" }
  ],
  "texts": [
    "Slogan gợi ý 1",
    "Slogan gợi ý 2",
    "Slogan gợi ý 3"
  ]
}`;

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${SYSTEM_PROMPT}\n\nÝ tưởng của khách hàng: "${aiPrompt}"`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 1500,
                            thinkingConfig: { thinkingBudget: 0 }, // tắt thinking mode
                        }
                    })
                }
            );

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const msg = errBody?.error?.message || `HTTP ${res.status}`;
                throw new Error(msg);
            }

            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

            // Lấy phần JSON từ response (bỏ markdown code block nếu có)
            let jsonStr = rawText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();

            // Tìm object JSON đầu tiên trong response
            const start = jsonStr.indexOf('{');
            const end = jsonStr.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                jsonStr = jsonStr.substring(start, end + 1);
            }

            const parsed = JSON.parse(jsonStr);
            setAiSuggestion(parsed);
            toast.success('AI đã tạo gợi ý thiết kế thành công!');
        } catch (err: any) {
            console.error('Gemini error:', err);
            const msg = err?.message || 'Lỗi không xác định';
            // Phân loại lỗi để thông báo rõ hơn
            if (msg.includes('quota') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED')) {
                setAiError('Quá giới hạn API miễn phí. Vui lòng thử lại sau vài phút, hoặc kiểm tra quota tại https://ai.dev/rate-limit');
            } else if (msg.includes('not found') || msg.includes('API_KEY_INVALID')) {
                setAiError('API Key không hợp lệ. Kiểm tra lại VITE_GEMINI_API_KEY trong file .env');
            } else {
                setAiError(`Lỗi: ${msg}`);
            }
            toast.error('Lỗi AI!');
        } finally {
            setIsAiLoading(false);
        }
    };

    // 6. Tính giá đơn (1 áo)
    const BASE_PRICE = 180000;
    // Tính tổng priceAddon của icons đang trên canvas (cả front + back)
    const getIconTotalPrice = () => {
        let total = 0;
        [fabricCanvas.current, backFabricCanvas.current].forEach(canvas => {
            if (!canvas) return;
            canvas.getObjects().forEach((obj: any) => {
                if (typeof obj._priceAddon === 'number') total += obj._priceAddon;
            });
        });
        return total;
    };
    const iconTotalPrice = getIconTotalPrice();
    const frontObjCount = fabricCanvas.current ? fabricCanvas.current.getObjects().length : 0;
    const backObjCount = backFabricCanvas.current ? backFabricCanvas.current.getObjects().length : 0;

    const unitPrice = BASE_PRICE + iconTotalPrice;
    const totalQtyModal = Object.values(sizeQty).reduce((a, b) => a + b, 0);
    const totalPrice = unitPrice * totalQtyModal;

    // 7. Lưu Thiết Kế vào LocalStorage
    const handleSaveDesign = () => {
        if (!fabricCanvas.current) return;
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.renderAll();
        backFabricCanvas.current?.discardActiveObject();
        backFabricCanvas.current?.renderAll();
        const canvasDataURL = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 0.5 });
        const frontJSON = fabricCanvas.current.toJSON(['id', 'selectable']);
        const backJSON = backFabricCanvas.current?.toJSON(['id', 'selectable']) ?? { objects: [] };
        const newEntry = {
            id: Date.now(),
            name: 'Thiết kế ' + new Date().toLocaleDateString('vi-VN'),
            time: new Date().toLocaleString('vi-VN'),
            thumbnail: canvasDataURL,
            shirtColor: shirtColorHex,
            canvasJSON: frontJSON,
            backCanvasJSON: backJSON,
            objectCount: frontObjCount + backObjCount,
        };
        const updatedHistory = [newEntry, ...historyList].slice(0, 20);
        setHistoryList(updatedHistory);
        localStorage.setItem('alma_design_history', JSON.stringify(updatedHistory));
        toast.success('Đã lưu thiết kế thành công!');
    };

    // 8. Tải lại thiết kế từ Lịch sử
    const loadDesignFromHistory = (entry: any) => {
        if (!fabricCanvas.current) return;
        fabricCanvas.current.loadFromJSON(entry.canvasJSON, () => {
            fabricCanvas.current?.renderAll();
        });
        if (entry.backCanvasJSON && backFabricCanvas.current) {
            backFabricCanvas.current.loadFromJSON(entry.backCanvasJSON, () => {
                backFabricCanvas.current?.renderAll();
            });
        }
        setShirtColorHex(entry.shirtColor || '#FFFFFF');
        setHistoryOpen(false);
        toast.success('Đã tải lại thiết kế!');
    };

    // 9. Mở modal chọn size & số lượng rồi thêm vào giỏ
    const handleOpenCartModal = () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            navigate('/login');
            return;
        }
        const frontEmpty = !fabricCanvas.current || fabricCanvas.current.getObjects().length === 0;
        const backEmpty = !backFabricCanvas.current || backFabricCanvas.current.getObjects().length === 0;
        if (frontEmpty && backEmpty) {
            toast.error('Hãy thêm ít nhất 1 họa tiết hoặc chữ lên áo!');
            return;
        }
        setCartModalOpen(true);
    };

    const handleConfirmAddToCart = async () => {
        if (!fabricCanvas.current) return;
        const hasAny = Object.values(sizeQty).some(q => q > 0);
        if (!hasAny) { toast.error('Vui lòng chọn ít nhất 1 size với số lượng > 0!'); return; }
        setIsAddingToCart(true);
        try {
            fabricCanvas.current.discardActiveObject();
            fabricCanvas.current.renderAll();
            backFabricCanvas.current?.discardActiveObject();
            backFabricCanvas.current?.renderAll();
            const previewDataUrl = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 0.5 });
            const canvasJSON = JSON.stringify(fabricCanvas.current.toJSON(['id', 'selectable']));
            await customizerApi.saveAndAddMultiSize(
                { baseProductId: selectedProduct?.baseProductId ?? 1, canvasJson: canvasJSON, previewImageUrl: previewDataUrl, iconIds: usedIconIds, fontIds: [] },
                sizeQty
            );
            const summary = Object.entries(sizeQty).filter(([, q]) => q > 0).map(([s, q]) => `${s}×${q}`).join(', ');
            toast.success(`Đã thêm vào giỏ hàng! (${summary})`);
            setCartModalOpen(false);
            setSizeQty({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
            navigate('/cart');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.response?.data || 'Lỗi khi thêm vào giỏ hàng!';
            toast.error(msg);
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Màu áo - các lựa chọn
    const SHIRT_COLORS = [
        { code: '#FFFFFF', label: 'Trắng', bg: '#FFFFFF' },
        { code: '#1a1a1a', label: 'Đen', bg: '#1a1a1a' },
        { code: '#374151', label: 'Xám Đậm', bg: '#374151' },
        { code: '#9ca3af', label: 'Xám Nhạt', bg: '#9ca3af' },
        { code: '#1d4ed8', label: 'Xanh Dương', bg: '#1d4ed8' },
        { code: '#0ea5e9', label: 'Xanh Sky', bg: '#0ea5e9' },
        { code: '#059669', label: 'Xanh Lá', bg: '#059669' },
        { code: '#dc2626', label: 'Đỏ', bg: '#dc2626' },
        { code: '#ea580c', label: 'Cam', bg: '#ea580c' },
        { code: '#d97706', label: 'Vàng', bg: '#d97706' },
        { code: '#7c3aed', label: 'Tím', bg: '#7c3aed' },
        { code: '#db2777', label: 'Hồng', bg: '#db2777' },
        { code: '#0f172a', label: 'Navy', bg: '#0f172a' },
        { code: '#92400e', label: 'Nâu', bg: '#92400e' },
        { code: '#065f46', label: 'Xanh Rừng', bg: '#065f46' },
    ];
    const [shirtColorHex, setShirtColorHex] = useState('#FFFFFF');

    // --- States for background-removed transparent product images ---
    const [processedImages, setProcessedImages] = useState<Record<string, string>>({});
    const [isImageProcessing, setIsImageProcessing] = useState(false);

    // --- Helper function to remove white background using Canvas & Flood-Fill ---
    const removeBackground = (imgElement: HTMLImageElement, callback: (dataUrl: string) => void) => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = imgElement.naturalWidth || imgElement.width;
        let h = imgElement.naturalHeight || imgElement.height;
        if (w > maxDim || h > maxDim) {
            if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
            } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
            }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(imgElement, 0, 0, w, h);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const visited = new Uint8Array(w * h);
        const queue: number[] = [];

        const getPixel = (x: number, y: number) => {
            const idx = (y * w + x) * 4;
            return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
        };

        const isBackground = (r: number, g: number, b: number, a: number, cr: number, cg: number, cb: number) => {
            if (a < 10) return true;
            const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
            return dist < 30; // Optimal tolerance threshold
        };

        const corners = [
            [0, 0],
            [w - 1, 0],
            [0, h - 1],
            [w - 1, h - 1]
        ];

        corners.forEach(([cx, cy]) => {
            const idx = cy * w + cx;
            const [r, g, b, a] = getPixel(cx, cy);
            if (a >= 10 && !visited[idx]) {
                visited[idx] = 1;
                queue.push(cx, cy, r, g, b);
            }
        });

        let head = 0;
        while (head < queue.length) {
            const x = queue[head++];
            const y = queue[head++];
            const cr = queue[head++];
            const cg = queue[head++];
            const cb = queue[head++];

            const idx = (y * w + x) * 4;
            data[idx + 3] = 0; // Alpha set to transparent

            const neighbors = [
                [x + 1, y],
                [x - 1, y],
                [x, y + 1],
                [x, y - 1]
            ];

            for (let i = 0; i < neighbors.length; i++) {
                const [nx, ny] = neighbors[i];
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nidx = ny * w + nx;
                    if (!visited[nidx]) {
                        const [nr, ng, nb, na] = getPixel(nx, ny);
                        if (isBackground(nr, ng, nb, na, cr, cg, cb)) {
                            visited[nidx] = 1;
                            queue.push(nx, ny, cr, cg, cb);
                        }
                    }
                }
            }
        }

        ctx.putImageData(imgData, 0, 0);
        callback(canvas.toDataURL('image/png'));
    };

    // --- Active Product Image URL (handles both front and back views) ---
    const activeProductUrl = viewMode === 'front'
        ? (resolveApiAssetUrl(selectedProduct?.frontImageUrl) ?? '/images/Phoi_ao/áo cộc tay ko cổ.jpg')
        : (resolveApiAssetUrl(selectedProduct?.backImageUrl) ?? resolveApiAssetUrl(selectedProduct?.frontImageUrl) ?? '/images/Phoi_ao/áo cộc tay ko cổ.jpg');

    // --- Automatically process background removal when active URL changes ---
    useEffect(() => {
        if (!activeProductUrl) return;
        if (processedImages[activeProductUrl]) return;

        setIsImageProcessing(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = activeProductUrl;
        img.onload = () => {
            removeBackground(img, (dataUrl) => {
                setProcessedImages(prev => ({
                    ...prev,
                    [activeProductUrl]: dataUrl
                }));
                setIsImageProcessing(false);
            });
        };
        img.onerror = () => {
            console.error('Failed to load product image for background removal:', activeProductUrl);
            setIsImageProcessing(false);
        };
    }, [activeProductUrl, processedImages]);

    const currentLayers = (getActiveCanvas()?.getObjects() || []);
    const shirtMaskUrl = processedImages[activeProductUrl];
    const activePrintAreaStyle = getPrintAreaOverlayStyle(selectedProduct?.printArea?.[viewMode]);

    return (
        <div className="bg-gray-50 h-screen overflow-hidden flex flex-col font-['Outfit']">
            {/* --- NAVBAR --- */}
            <nav className="bg-white border-b px-4 sm:px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-50 relative h-16">
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-gray-400 hover:text-gray-800 transition"><i className="fa-solid fa-arrow-left"></i></Link>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="ALMA Logo" className="h-8 w-auto object-contain" />
                        <span className="font-bold text-lg md:text-xl text-gray-800 whitespace-nowrap hidden sm:block">ALMA Custom Threads<span className="text-blue-600">.</span></span>
                    </Link>
                    <span className="ml-4 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium border border-blue-100 hidden sm:block">Đang thiết kế: {selectedProduct?.name ?? '...'}</span>
                </div>
                <div className="flex gap-4 items-center">
                    <Link to="/cart" className="text-gray-500 hover:text-gray-800 relative mr-4">
                        <i className="fa-solid fa-cart-shopping text-lg"></i>
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">1</span>
                    </Link>
                    <button onClick={() => setHistoryOpen(true)} className="text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-1.5">
                        <i className="fa-solid fa-clock-rotate-left"></i>
                        <span className="hidden sm:inline">Lịch Sử</span>
                        {historyList.length > 0 && <span className="bg-blue-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{historyList.length}</span>}
                    </button>
                    <button onClick={handleSaveDesign} className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-1.5">
                        <i className="fa-regular fa-floppy-disk"></i> Lưu Thiết Kế
                    </button>
                </div>
            </nav>

            <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] relative">
                {/* --- LEFT SIDEBAR (TOOLS) --- */}
                <aside className={`absolute md:relative inset-y-0 left-0 transform ${leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 bg-white border-r flex flex-col shrink-0 overflow-y-auto z-40 shadow-[4px_0_15px_rgba(0,0,0,0.02)] transition-transform duration-300`}>
                    <button className="md:hidden absolute top-3 right-3 text-gray-400" onClick={() => setLeftSidebarOpen(false)}><i className="fa-solid fa-xmark text-lg"></i></button>

                    <div className="flex mb-4 px-4 pt-4">
                        <button className="w-full py-2.5 text-sm text-center bg-white border border-b-2 border-b-blue-600 text-blue-600 font-semibold shadow-sm rounded-t-lg relative z-10 -mb-0.5">Customizer</button>
                    </div>

                    <div className="flex flex-col px-4 text-sm text-gray-700 font-medium">
                        <div onClick={() => setActiveTab('base')} className={`flex items-center gap-3 p-3.5 border border-gray-200 border-b-0 cursor-pointer rounded-t-lg transition ${activeTab === 'base' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                            <i className="fa-solid fa-shirt w-5 text-center text-blue-500 text-lg"></i> Kiểu Dáng (Phôi Áo)
                        </div>
                        <div onClick={() => setActiveTab('ai')} className={`flex items-center gap-3 p-3.5 border border-gray-200 border-b-0 cursor-pointer transition ${activeTab === 'ai' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                            <i className="fa-solid fa-wand-magic-sparkles w-5 text-center text-purple-500 text-lg"></i> AI Thiết Kế
                        </div>
                        <div onClick={() => setActiveTab('text')} className={`flex items-center gap-3 p-3.5 border border-gray-200 rounded-b-lg cursor-pointer transition ${activeTab === 'text' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}>
                            <i className="fa-solid fa-font w-5 text-center text-green-500 text-lg"></i> Thêm Chữ
                        </div>
                    </div>

                    <div className="px-4 mt-6 flex-1 border-t pt-4 overflow-y-auto custom-scrollbar">
                        {/* TAB BASE & STICKERS */}
                        {activeTab === 'base' && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 mt-2">Chọn Phôi Áo</h4>
                                {baseProductsLoading ? (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải phôi áo...
                                    </div>
                                ) : (
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {baseProducts.map(p => (
                                        <div
                                            key={p.baseProductId}
                                            onClick={() => setSelectedProductId(p.baseProductId)}
                                            className={`bg-gray-50 rounded-lg p-2 text-center cursor-pointer relative shadow-sm border-2 transition-all hover:shadow-md ${selectedProductId === p.baseProductId
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                                }`}
                                        >
                                            <img
                                                src={resolveApiAssetUrl(p.frontImageUrl) ?? '/images/Phoi_ao/áo cộc tay ko cổ.jpg'}
                                                className="w-full aspect-square object-cover bg-white rounded"
                                                alt={p.name}
                                                onError={(e) => (e.target as HTMLImageElement).src = '/images/Phoi_ao/áo cộc tay ko cổ.jpg'}
                                            />
                                            <p className={`text-[10px] font-bold mt-2 ${selectedProductId === p.baseProductId ? 'text-blue-600' : 'text-gray-600'
                                                }`}>{p.name}</p>
                                            {selectedProductId === p.baseProductId && (
                                                <i className="fa-solid fa-circle-check absolute -top-2 -right-2 text-blue-500 bg-white rounded-full text-sm"></i>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                )}

                                <div className="w-full h-px bg-gray-200 mb-4"></div>

                                {/* SECTION: Icon cố định */}
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Stickers Có Sẵn <span className="text-green-500 normal-case font-normal">(miễn phí)</span>
                                </h4>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    {([
                                        { iconId: 101, name: 'Star', imageUrl: '/images/stickers/1.png', priceAddon: 0 },
                                        { iconId: 102, name: 'Heart', imageUrl: '/images/stickers/2.png', priceAddon: 0 },
                                        { iconId: 103, name: 'Flash', imageUrl: '/images/stickers/3.png', priceAddon: 0 },
                                        { iconId: 104, name: 'Crown', imageUrl: '/images/stickers/4.png', priceAddon: 0 },
                                        { iconId: 105, name: 'Fire', imageUrl: '/images/stickers/5.png', priceAddon: 0 },
                                        { iconId: 106, name: 'Peace', imageUrl: '/images/stickers/9.png', priceAddon: 0 },
                                    ] as import('../types').IconDto[]).map(icon => (
                                        <div key={icon.iconId} onClick={() => handleAddIcon(icon)}
                                            className="relative group cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-2 hover:border-green-500 hover:shadow-md transition flex flex-col items-center gap-1">
                                            <img src={resolveApiAssetUrl(icon.imageUrl) ?? '/images/placeholder.png'} className="w-full aspect-square object-contain" alt={icon.name}
                                                onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.png'} />
                                            <p className="text-[9px] text-gray-500 truncate w-full text-center">{icon.name}</p>
                                            <span className="text-[9px] font-bold text-green-600">Miễn phí</span>
                                            <div className="absolute inset-0 bg-green-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <i className="fa-solid fa-plus text-green-600 text-lg"></i>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* SECTION: Icons từ DB */}
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Thư viện Icons <span className="text-blue-500 normal-case font-normal">(từ DB)</span>
                                </h4>
                                {iconsLoading ? (
                                    <div className="flex items-center justify-center py-8 text-gray-400">
                                        <i className="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải icons...
                                    </div>
                                ) : icons.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic text-center py-4">Chưa có icon nào trong DB.</p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2 pb-4">
                                        {icons.map(icon => (
                                            <div key={icon.iconId} onClick={() => handleAddIcon(icon)}
                                                className="relative group cursor-pointer bg-gray-50 border border-gray-200 rounded-lg p-2 hover:border-blue-500 hover:shadow-md transition flex flex-col items-center gap-1">
                                                <img src={resolveApiAssetUrl(icon.imageUrl) ?? '/images/placeholder.png'} className="w-full aspect-square object-contain" alt={icon.name}
                                                    onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.png'} />
                                                <p className="text-[9px] text-gray-500 truncate w-full text-center">{icon.name}</p>
                                                {icon.priceAddon > 0 ? (
                                                    <span className="text-[9px] font-bold text-blue-600">+{icon.priceAddon.toLocaleString('vi-VN')}đ</span>
                                                ) : (
                                                    <span className="text-[9px] font-bold text-green-600">Miễn phí</span>
                                                )}
                                                <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                    <i className="fa-solid fa-plus text-blue-600 text-lg"></i>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div>
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3 mt-2 flex items-center gap-2">
                                    <i className="fa-solid fa-sparkles"></i> AI Thiết Kế
                                </h4>
                                <p className="text-xs text-gray-500 mb-3">
                                    Mô tả ý tưởng thiết kế, AI sẽ gợi ý icon, màu sắc, chữ và phong cách phù hợp.
                                </p>
                                <textarea
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                    rows={3}
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                                    placeholder="Ví dụ: Phi hành gia phong cách Streetwear, áo đen, chữ in nổi bật..."
                                />
                                <button
                                    onClick={handleGenerateAI}
                                    disabled={isAiLoading}
                                    className="w-full mt-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition flex justify-center items-center gap-2 disabled:opacity-60 hover:opacity-90"
                                >
                                    {isAiLoading
                                        ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang tạo...</>
                                        : <><i className="fa-solid fa-wand-magic-sparkles"></i> Gợi Ý Thiết Kế</>
                                    }
                                </button>

                                {/* Lỗi */}
                                {aiError && (
                                    <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg flex gap-2">
                                        <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
                                        <span>{aiError}</span>
                                    </div>
                                )}

                                {/* Kết quả AI */}
                                {aiSuggestion && (
                                    <div className="mt-4 space-y-4 pb-4">
                                        {/* Concept */}
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                                            <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <i className="fa-solid fa-lightbulb"></i> Concept
                                            </p>
                                            <p className="text-xs text-gray-700 leading-relaxed">{aiSuggestion.concept}</p>
                                            <span className="mt-2 inline-block text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                                {aiSuggestion.style}
                                            </span>
                                        </div>

                                        {/* Icons gợi ý */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <i className="fa-solid fa-icons"></i> Gợi Ý Icon / Họa Tiết
                                            </p>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                {aiSuggestion.icons.map((icon, i) => (
                                                    <div key={i} className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg p-2 text-xs">
                                                        <span className="text-xl leading-none">{icon.emoji}</span>
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{icon.name}</p>
                                                            <p className="text-gray-500 text-[10px]">{icon.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Màu sắc */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <i className="fa-solid fa-palette"></i> Bảng Màu Gợi Ý
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {aiSuggestion.colors.map((c, i) => (
                                                    <button
                                                        key={i}
                                                        title={`Áp dụng màu ${c.name}`}
                                                        onClick={() => setShirtColorHex(c.hex)}
                                                        className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-2 py-1 hover:border-blue-400 transition text-xs"
                                                    >
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                                                            style={{ backgroundColor: c.hex }}
                                                        />
                                                        <span className="text-gray-700 text-[10px]">{c.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chữ / Slogan */}
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <i className="fa-solid fa-font"></i> Gợi Ý Chữ / Slogan
                                            </p>
                                            <div className="flex flex-col gap-1.5">
                                                {aiSuggestion.texts.map((t, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            const ac = getActiveCanvas();
                                                            if (!ac) return;
                                                            const textObj = new (window as any).fabric.IText(t, {
                                                                left: ac.width! / 2,
                                                                top: ac.height! / 2,
                                                                originX: 'center', originY: 'center',
                                                                fontSize: 24, fontFamily: 'Impact',
                                                                fill: '#1e293b',
                                                                cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
                                                                transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
                                                            });
                                                            ac.add(textObj);
                                                            ac.setActiveObject(textObj);
                                                            constrainObject(viewMode, textObj, ac, true);
                                                        }}
                                                        className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition font-medium flex justify-between items-center group"
                                                    >
                                                        <span>&#34;{t}&#34;</span>
                                                        <i className="fa-solid fa-plus text-purple-400 opacity-0 group-hover:opacity-100 transition"></i>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB TEXT */}
                        {activeTab === 'text' && (
                            <div>
                                <h4 className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3 mt-2 flex items-center gap-2"><i className="fa-solid fa-font"></i> Thêm Chữ Lên Áo</h4>
                                <div className="mb-3">
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Nội dung</label>
                                    <input type="text" id="text-content-input" defaultValue="Text mới" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="mb-3">
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Font chữ</label>
                                    <select id="text-font-select" defaultValue="Impact" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                                        <option value="Arial">Arial</option><option value="Impact">Impact</option><option value="Georgia">Georgia</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div><label className="text-xs font-medium text-gray-600 block">Cỡ chữ</label><input type="number" id="text-size-input" defaultValue="28" className="w-full border rounded-lg p-2.5 text-sm" /></div>
                                    <div><label className="text-xs font-medium text-gray-600 block">Màu chữ</label><input type="color" id="text-color-input" defaultValue="#000000" className="w-full h-[42px] border rounded-lg cursor-pointer" /></div>
                                </div>
                                <button onClick={handleAddText} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg flex justify-center gap-2"><i className="fa-solid fa-plus"></i> Thêm Chữ Vào Áo</button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* --- MAIN CANVAS AREA --- */}
                <main className="flex-1 flex flex-col relative bg-gray-50/50 w-full" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

                    {/* Mobile Toggles */}
                    <div className="md:hidden flex justify-between items-center px-4 py-2 bg-white/80 backdrop-blur border-b absolute top-0 w-full z-30">
                        <button onClick={() => { setLeftSidebarOpen(true); setRightSidebarOpen(false); }} className="flex flex-col items-center text-blue-600 bg-blue-50 px-4 py-1.5 rounded font-bold text-xs"><i className="fa-solid fa-palette mb-1"></i> Công Cụ</button>
                        <button onClick={() => { setRightSidebarOpen(true); setLeftSidebarOpen(false); }} className="flex flex-col items-center text-purple-600 bg-purple-50 px-4 py-1.5 rounded font-bold text-xs"><i className="fa-solid fa-sliders mb-1"></i> Tùy Chỉnh</button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center p-4 mt-10 md:mt-0">
                        {/* Khu vực Mô phỏng Áo (Cực kỳ quan trọng) */}
                        <div className="relative w-full max-w-[550px] aspect-[4/5] flex items-center justify-center shirt-container overflow-hidden rounded-xl">
                            {shirtColorHex !== '#FFFFFF' && shirtMaskUrl ? (
                                <div
                                    className="absolute w-[85%] h-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[11] pointer-events-none select-none"
                                    style={{
                                        backgroundColor: shirtColorHex,
                                        maskImage: `url(${shirtMaskUrl})`,
                                        maskPosition: 'center',
                                        maskRepeat: 'no-repeat',
                                        maskSize: 'contain',
                                        mixBlendMode: 'multiply',
                                        opacity: 0.72,
                                        transition: 'background-color 0.2s ease, opacity 0.2s ease',
                                        WebkitMaskImage: `url(${shirtMaskUrl})`,
                                        WebkitMaskPosition: 'center',
                                        WebkitMaskRepeat: 'no-repeat',
                                        WebkitMaskSize: 'contain',
                                    }}
                                />
                            ) : null}
                            {/* Hình nền Áo */}
                            <img
                                src={processedImages[activeProductUrl] ?? activeProductUrl}
                                alt={selectedProduct?.name ?? 'Phôi áo'}
                                className="w-[85%] object-contain drop-shadow-2xl select-none relative z-10"
                                draggable="false"
                                style={{
                                    opacity: isImageProcessing ? 0.6 : 1,
                                    transition: 'opacity 0.2s ease',
                                }}
                            />

                            {/* Khung vẽ Fabric.js - MẶT TRƯỚC */}
                            <div
                                ref={wrapperRef}
                                className="absolute w-[60%] h-[65%] top-[18%] left-[20%] z-20 border-2 border-transparent"
                                style={{
                                    visibility: viewMode === 'front' ? 'visible' : 'hidden',
                                    pointerEvents: viewMode === 'front' ? 'auto' : 'none',
                                }}
                            >
                                <canvas ref={canvasRef}></canvas>
                                <div
                                    className="absolute z-30 pointer-events-none rounded-md border-2 border-dashed border-sky-400/80 bg-sky-100/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.03)]"
                                    style={activePrintAreaStyle}
                                />
                            </div>
                            {/* Khung vẽ Fabric.js - MẶT SAU */}
                            <div
                                ref={backWrapperRef}
                                className="absolute w-[60%] h-[65%] top-[18%] left-[20%] z-20 border-2 border-transparent"
                                style={{
                                    visibility: viewMode === 'back' ? 'visible' : 'hidden',
                                    pointerEvents: viewMode === 'back' ? 'auto' : 'none',
                                }}
                            >
                                <canvas ref={backCanvasRef}></canvas>
                                <div
                                    className="absolute z-30 pointer-events-none rounded-md border-2 border-dashed border-sky-400/80 bg-sky-100/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.03)]"
                                    style={activePrintAreaStyle}
                                />
                            </div>
                        </div>

                        {/* Thanh công cụ nổi */}
                        <div className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-white border rounded shadow flex flex-col z-30 w-11 overflow-hidden">
                            <button onClick={() => handleFloatingAction('flip')} className="h-11 text-gray-500 hover:text-blue-600 hover:bg-gray-50 border-b flex items-center justify-center"><i className="fa-solid fa-arrows-up-down"></i></button>
                            <button onClick={() => handleFloatingAction('center')} className="h-11 text-gray-500 hover:text-blue-600 hover:bg-gray-50 border-b flex items-center justify-center"><i className="fa-solid fa-align-center fa-rotate-90"></i></button>
                            <button onClick={() => handleFloatingAction('down')} className="h-11 text-gray-500 hover:text-blue-600 hover:bg-gray-50 border-b flex items-center justify-center"><i className="fa-solid fa-angle-left"></i></button>
                            <button onClick={() => handleFloatingAction('up')} className="h-11 text-gray-500 hover:text-blue-600 hover:bg-gray-50 border-b flex items-center justify-center"><i className="fa-solid fa-angle-right"></i></button>
                            <button onClick={() => handleFloatingAction('delete')} className="h-11 text-red-500 hover:text-red-700 hover:bg-red-50 border-b flex items-center justify-center"><i className="fa-regular fa-trash-can"></i></button>
                            <button onClick={() => handleFloatingAction('clone')} className="h-11 text-gray-500 hover:text-blue-600 hover:bg-gray-50 flex items-center justify-center"><i className="fa-regular fa-copy"></i></button>
                        </div>
                    </div>

                    {/* Nút Chọn Mặt Trước/Sau */}
                    <div className="h-16 flex items-center justify-center shrink-0 mb-[70px] md:mb-6 z-20 w-full absolute bottom-4">
                        <div className="flex border border-gray-300 rounded overflow-hidden shadow-lg bg-white">
                            <button onClick={() => setViewMode('front')} className={`px-6 py-2.5 text-xs sm:text-sm font-semibold transition ${viewMode === 'front' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Mặt Trước</button>
                            <button onClick={() => setViewMode('back')} className={`px-6 py-2.5 border-l border-gray-300 text-xs sm:text-sm font-medium transition ${viewMode === 'back' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>Mặt Sau</button>
                        </div>
                    </div>
                </main>

                {/* --- RIGHT SIDEBAR (TÙY CHỈNH) --- */}
                <aside className={`absolute md:relative inset-y-0 right-0 transform ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} w-80 bg-white border-l shrink-0 flex flex-col z-40 shadow-[-4px_0_15px_rgba(0,0,0,0.02)] transition-transform duration-300`}>
                    <button className="md:hidden absolute top-2 right-2 text-gray-400" onClick={() => setRightSidebarOpen(false)}><i className="fa-solid fa-xmark text-lg px-2"></i></button>

                    <div className="flex-1 overflow-y-auto custom-scrollbar mt-12 md:mt-0">
                        <div className="p-5 border-b">
                            <p className="text-sm text-gray-800 mt-2 mb-3 font-semibold flex items-center gap-2">
                                <i className="fa-solid fa-palette text-blue-500"></i> Màu Áo
                                <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {SHIRT_COLORS.find(c => c.code === shirtColorHex)?.label ?? 'Tùy chỉnh'}
                                </span>
                            </p>
                            <div className="grid grid-cols-5 gap-2 mb-3">
                                {SHIRT_COLORS.map(c => (
                                    <button
                                        key={c.code}
                                        title={c.label}
                                        onClick={() => setShirtColorHex(c.code)}
                                        className={`w-10 h-10 rounded-xl border-2 shadow-sm flex items-center justify-center transition-all hover:scale-110 ${
                                            shirtColorHex === c.code
                                                ? 'border-blue-500 scale-110 ring-2 ring-blue-300'
                                                : 'border-gray-200 hover:border-gray-400'
                                        }`}
                                        style={{ backgroundColor: c.bg }}
                                    >
                                        {shirtColorHex === c.code && (
                                            <i className={`fa-solid fa-check text-xs ${c.code === '#FFFFFF' ? 'text-blue-500' : 'text-white'}`}></i>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <label className="text-xs text-gray-500 font-medium">Tùy chỉnh:</label>
                                <input
                                    type="color"
                                    value={shirtColorHex}
                                    onChange={e => setShirtColorHex(e.target.value)}
                                    className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                                />
                                <span className="text-xs text-gray-400 font-mono">{shirtColorHex.toUpperCase()}</span>
                                <button
                                    onClick={() => setShirtColorHex('#FFFFFF')}
                                    className="ml-auto text-xs text-blue-500 hover:underline"
                                >Reset</button>
                            </div>
                        </div>

                        {/* Layer List */}
                        <div onClick={() => setLayersVisible(!layersVisible)} className="flex justify-between items-center p-4 border-b cursor-pointer hover:bg-gray-50">
                            <h3 className="text-sm text-gray-700 font-medium">Họa tiết đã dùng <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs ml-2 font-bold">{currentLayers.length}</span></h3>
                            <i className={`fa-solid fa-chevron-${layersVisible ? 'up' : 'down'} text-gray-400 text-xs`}></i>
                        </div>
                        {layersVisible && (
                            <div className="px-4 py-3 bg-gray-50 border-b">
                                {currentLayers.length === 0 ? <p className="text-xs text-gray-400 italic">Chưa có họa tiết nào.</p> :
                                    currentLayers.map((obj: any, i) => {
                                        const isText = obj.type === 'i-text' || obj.type === 'text';
                                        return (
                                            <div key={i} className="flex justify-between items-center text-sm bg-white border p-2 rounded shadow-sm mb-1 cursor-pointer hover:bg-blue-50" onClick={() => { const ac = getActiveCanvas(); ac?.setActiveObject(obj); ac?.renderAll(); }}>
                                                <span className="font-medium text-gray-800 truncate">
                                                    <i className={`fa-solid ${isText ? 'fa-t' : 'fa-image'} text-gray-400 mr-2`}></i>
                                                    {isText ? `"${obj.text?.substring(0, 10)}..."` : `Sticker ${i + 1}`}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); const ac = getActiveCanvas(); ac?.remove(obj); ac?.renderAll(); }} className="text-red-400 hover:text-red-600"><i className="fa-regular fa-trash-can"></i></button>
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        )}
                    </div>

                    <div className="bg-gradient-to-b from-white to-gray-50 flex flex-col pt-0 border-t">
                        <div className="p-4 pb-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Giá / áo:</span>
                                <span className="font-bold text-gray-800">{unitPrice.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">Số lượng:</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedQty(q => Math.max(1, q - 1))} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition">-</button>
                                    <span className="font-bold w-5 text-center">{selectedQty}</span>
                                    <button onClick={() => setSelectedQty(q => q + 1)} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 transition">+</button>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                <span className="text-sm font-semibold text-gray-700">Tạm tính:</span>
                                <span className="text-xl font-black text-blue-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                        <div className="p-4 pt-1">
                            <button onClick={handleOpenCartModal} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] flex justify-center items-center gap-2 transition-all hover:-translate-y-0.5">
                                <i className="fa-regular fa-square-check text-lg"></i> Chốt &amp; Cho Vào Giỏ
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* --- CART MODAL --- */}
            {cartModalOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div onClick={() => setCartModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-white">Chọn Size &amp; Số Lượng</h2>
                                <p className="text-xs text-blue-100 mt-0.5">Có thể chọn nhiều size cùng lúc</p>
                            </div>
                            <button onClick={() => setCartModalOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition">
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Size steppers */}
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Số lượng theo size</p>
                                <div className="space-y-3 mb-5">
                                    {['S', 'M', 'L', 'XL', 'XXL'].map(s => {
                                        const qty = sizeQty[s] || 0;
                                        const isSelected = qty > 0;
                                        return (
                                            <div key={s} className={`flex items-center justify-between rounded-xl px-4 py-3 border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>{s}</span>
                                                    <span className="text-sm text-gray-500">{unitPrice.toLocaleString('vi-VN')}đ</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setSizeQty(prev => ({ ...prev, [s]: Math.max(0, (prev[s] || 0) - 1) }))}
                                                        className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 flex items-center justify-center font-bold text-gray-600 hover:text-red-500 transition shadow-sm">
                                                        −
                                                    </button>
                                                    <span className={`w-6 text-center font-black text-lg ${isSelected ? 'text-blue-600' : 'text-gray-300'}`}>{qty}</span>
                                                    <button
                                                        onClick={() => setSizeQty(prev => ({ ...prev, [s]: (prev[s] || 0) + 1 }))}
                                                        className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center font-bold text-white transition shadow-md">
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Summary */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-5">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Giá / áo</span>
                                        <span className="font-semibold">{unitPrice.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Tổng số lượng</span>
                                        <span className="font-semibold">{totalQtyModal} áo</span>
                                    </div>
                                    {Object.entries(sizeQty).filter(([, q]) => q > 0).map(([s, q]) => (
                                        <div key={s} className="flex justify-between text-xs text-blue-600 mb-0.5">
                                            <span>· Size {s}</span><span>× {q}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between font-black text-base border-t border-blue-200 pt-2 mt-2">
                                        <span className="text-gray-800">Tổng tiền</span>
                                        <span className="text-blue-600 text-xl">{totalPrice.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleConfirmAddToCart} disabled={isAddingToCart || totalQtyModal === 0}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {isAddingToCart
                                    ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý...</>
                                    : <><i className="fa-solid fa-cart-plus"></i> Thêm {totalQtyModal > 0 ? `${totalQtyModal} áo` : ''} Vào Giỏ Hàng</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* --- HISTORY PANEL --- */}
            <div className={`fixed inset-0 z-[200] flex ${historyOpen ? '' : 'pointer-events-none'}`}>
                <div onClick={() => setHistoryOpen(false)} className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${historyOpen ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className={`relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${historyOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div>
                            <h2 className="text-base font-bold flex items-center gap-2"><i className="fa-solid fa-clock-rotate-left"></i> Lịch Sử Thiết Kế</h2>
                            <p className="text-xs text-blue-100 mt-0.5">Các bản thiết kế đã lưu của bạn</p>
                        </div>
                        <button onClick={() => setHistoryOpen(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><i className="fa-solid fa-xmark"></i></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {historyList.length === 0 ? (
                            <div className="flex flex-col items-center py-16">
                                <i className="fa-regular fa-folder-open text-4xl text-gray-300 mb-4"></i>
                                <p className="text-gray-500 font-semibold">Chưa có thiết kế nào</p>
                            </div>
                        ) : (
                            historyList.map((entry, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-3">
                                    <div className="flex gap-3">
                                        <div className="shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center relative">
                                            <div className="absolute inset-0" style={{ backgroundColor: entry.shirtColor }}></div>
                                            <img src={entry.thumbnail} className="w-full h-full object-contain relative z-10" alt="thumb" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{entry.name}</p>
                                            <p className="text-gray-400 text-xs mt-0.5">{entry.time}</p>
                                            <button onClick={() => loadDesignFromHistory(entry)} className="mt-3 py-1.5 w-full text-xs font-semibold text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition">
                                                <i className="fa-solid fa-rotate-left"></i> Tải lại bản này
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
