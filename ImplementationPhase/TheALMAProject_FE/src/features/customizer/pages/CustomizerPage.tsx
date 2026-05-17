import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { customizerApi } from '../api/customizerApi';
import { useAuth } from '../../auth/context/AuthContext';
import type { IconDto } from '../types';
import './CustomizerPage.css';

export default function CustomizerPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- Refs ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fabricCanvas = useRef<fabric.Canvas | null>(null);

    // --- States UI ---
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'base' | 'ai' | 'text'>('base');
    const [viewMode, setViewMode] = useState<'front' | 'back'>('front');
    const [layersVisible, setLayersVisible] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [selectedQty, setSelectedQty] = useState(1); // ← THÊM DÒNG NÀY


    // --- States Dữ liệu Thiết kế ---
    const [shirtColor, setShirtColor] = useState('transparent');
    const [layerTrigger, setLayerTrigger] = useState(0);
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
    const [aiResults, setAiResults] = useState<string[]>([]);

    // 1. Khởi tạo Fabric.js Canvas
    useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) return;

        const w = wrapperRef.current.offsetWidth;
        const h = wrapperRef.current.offsetHeight;

        fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
            width: w,
            height: h,
            backgroundColor: 'transparent',
            selection: true,
        });

        // Add default text (Giống HTML của bạn)
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

        // Lắng nghe sự kiện để cập nhật Layer List
        const updateLayers = () => setLayerTrigger(prev => prev + 1);
        fabricCanvas.current.on('object:added', updateLayers);
        fabricCanvas.current.on('object:removed', updateLayers);
        fabricCanvas.current.on('object:modified', updateLayers);
        updateLayers();

        // Load History
        try {
            const saved = JSON.parse(localStorage.getItem('alma_design_history') || '[]');
            setHistoryList(saved);
        } catch (e) {}

        // Handle Resize
        const handleResize = () => {
            if (fabricCanvas.current && wrapperRef.current) {
                fabricCanvas.current.setWidth(wrapperRef.current.offsetWidth);
                fabricCanvas.current.setHeight(wrapperRef.current.offsetHeight);
                fabricCanvas.current.renderAll();
            }
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            fabricCanvas.current?.dispose();
        };
    }, []);

    // Load icons từ DB khi mount
    useEffect(() => {
        customizerApi.getIcons().then(data => {
            setIcons(data);
            setIconsLoading(false);
        });
    }, []);

    // 2. Chức năng Thêm Chữ
    const handleAddText = () => {
        if (!fabricCanvas.current) return;
        const inputContent = (document.getElementById('text-content-input') as HTMLInputElement)?.value || 'Text mới';
        const font = (document.getElementById('text-font-select') as HTMLSelectElement)?.value || 'Arial';
        const size = parseInt((document.getElementById('text-size-input') as HTMLInputElement)?.value) || 28;
        const color = (document.getElementById('text-color-input') as HTMLInputElement)?.value || '#000000';

        const text = new fabric.IText(inputContent, {
            left: fabricCanvas.current.width! / 2, top: fabricCanvas.current.height! / 2,
            originX: 'center', originY: 'center',
            fontSize: size, fontFamily: font, fill: color,
            cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
            transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
        });
        fabricCanvas.current.add(text);
        fabricCanvas.current.setActiveObject(text);
    };

    // 3. Thêm Icon/Sticker lên canvas (track iconId)
    const handleAddIcon = (icon: IconDto) => {
        if (!fabricCanvas.current) return;
        fabric.Image.fromURL(icon.imageUrl, (img) => {
            const maxSize = fabricCanvas.current!.width! * 0.5;
            const scale = maxSize / Math.max(img.width!, img.height!);
            img.set({
                left: fabricCanvas.current!.width! / 2, top: fabricCanvas.current!.height! / 2,
                originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale,
                cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
                transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
            });
            fabricCanvas.current?.add(img);
            fabricCanvas.current?.setActiveObject(img);
            setUsedIconIds(prev => prev.includes(icon.iconId) ? prev : [...prev, icon.iconId]);
        }, { crossOrigin: 'anonymous' });
    };

    const handleAddSticker = (imgSrc: string) => {
        if (!fabricCanvas.current) return;
        fabric.Image.fromURL(imgSrc, (img) => {
            const maxSize = fabricCanvas.current!.width! * 0.5;
            const scale = maxSize / Math.max(img.width!, img.height!);
            img.set({
                left: fabricCanvas.current!.width! / 2, top: fabricCanvas.current!.height! / 2,
                originX: 'center', originY: 'center',
                scaleX: scale, scaleY: scale,
                cornerColor: '#3b82f6', cornerStyle: 'circle', cornerSize: 8,
                transparentCorners: false, borderColor: '#3b82f6', borderScaleFactor: 2,
            });
            fabricCanvas.current?.add(img);
            fabricCanvas.current?.setActiveObject(img);
        }, { crossOrigin: 'anonymous' });
    };

    // 4. Các nút Toolbar nổi
    const handleFloatingAction = (action: string) => {
        if (!fabricCanvas.current) return;
        const obj = fabricCanvas.current.getActiveObject();
        if (!obj) { toast.error("Vui lòng chọn 1 item!"); return; }

        switch (action) {
            case 'flip': obj.set('flipY', !obj.flipY); break;
            case 'center': obj.set({ left: fabricCanvas.current.width! / 2, originX: 'center' }); break;
            case 'down': fabricCanvas.current.sendBackwards(obj); break;
            case 'up': fabricCanvas.current.bringForward(obj); break;
            case 'delete': fabricCanvas.current.remove(obj); break;
            case 'clone': 
                obj.clone((cloned: fabric.Object) => {
                    cloned.set({ left: obj.left! + 20, top: obj.top! + 20 });
                    fabricCanvas.current?.add(cloned);
                    fabricCanvas.current?.setActiveObject(cloned);
                });
                break;
        }
        fabricCanvas.current.renderAll();
    };

    // 5. Sinh AI giả lập
    const handleGenerateAI = () => {
        if (!aiPrompt) { toast.error('Vui lòng nhập mô tả ý tưởng!'); return; }
        setIsAiLoading(true);
        setAiResults([]);
        setTimeout(() => {
            setIsAiLoading(false);
            setAiResults(['/images/stickers/9.png', '/images/stickers/11.png', '/images/stickers/2.png', '/images/stickers/3.png']);
        }, 2000);
    };

    // 6. Tính giá đơn (1 áo)
    const BASE_PRICE = 180000;
    const PRINT_PRICE = 30000;
    const hasDesign = fabricCanvas.current ? fabricCanvas.current.getObjects().length > 0 : false;
    const unitPrice = BASE_PRICE + (hasDesign ? PRINT_PRICE : 0);
    const totalQtyModal = Object.values(sizeQty).reduce((a, b) => a + b, 0);
    const totalPrice = unitPrice * totalQtyModal;

    // 7. Lưu Thiết Kế vào LocalStorage
    const handleSaveDesign = () => {
        if (!fabricCanvas.current) return;
        fabricCanvas.current.discardActiveObject();
        fabricCanvas.current.renderAll();
        const canvasDataURL = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 0.5 });
        const canvasJSON = fabricCanvas.current.toJSON(['id', 'selectable']);
        const newEntry = {
            id: Date.now(),
            name: 'Thiết kế ' + new Date().toLocaleDateString('vi-VN'),
            time: new Date().toLocaleString('vi-VN'),
            thumbnail: canvasDataURL,
            shirtColor,
            canvasJSON,
            objectCount: fabricCanvas.current.getObjects().length,
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
            setShirtColor(entry.shirtColor || 'transparent');
            setHistoryOpen(false);
            toast.success('Đã tải lại thiết kế!');
        });
    };

    // 9. Mở modal chọn size & số lượng rồi thêm vào giỏ
    const handleOpenCartModal = () => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để thêm vào giỏ hàng!');
            navigate('/login');
            return;
        }
        if (!fabricCanvas.current || fabricCanvas.current.getObjects().length === 0) {
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
            const previewDataUrl = fabricCanvas.current.toDataURL({ format: 'png', multiplier: 0.5 });
            const canvasJSON = JSON.stringify(fabricCanvas.current.toJSON(['id', 'selectable']));
            await customizerApi.saveAndAddMultiSize(
                { baseProductId: 1, canvasJson: canvasJSON, previewImageUrl: previewDataUrl, iconIds: usedIconIds, fontIds: [] },
                sizeQty
            );
            const summary = Object.entries(sizeQty).filter(([, q]) => q > 0).map(([s, q]) => `${s}×${q}`).join(', ');
            toast.success(`Đã thêm vào giỏ hàng! (${summary})`);
            setCartModalOpen(false);
            setSizeQty({ S: 0, M: 0, L: 0, XL: 0, XXL: 0 });
            navigate('/cart');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng!');
        } finally {
            setIsAddingToCart(false);
        }
    };

    // Chuẩn bị danh sách màu và sticker cho giao diện
    const colors = [
        { code: 'transparent', bgClass: 'bg-white' },
        { code: '#222222', bgClass: 'bg-black' },
        { code: '#9ca3af', bgClass: 'bg-gray-400' },
        { code: '#f9a8d4', bgClass: 'bg-pink-300' },
        { code: '#dbeafe', bgClass: 'bg-blue-100' },
        { code: '#4ade80', bgClass: 'bg-green-400' },
        { code: '#c084fc', bgClass: 'bg-purple-400' },
        { code: '#fde047', bgClass: 'bg-yellow-300' },
        { code: '#f97316', bgClass: 'bg-orange-500' },
        { code: '#dc2626', bgClass: 'bg-red-600' }
    ];

    const currentLayers = fabricCanvas.current?.getObjects() || [];

    return (
        <div className="bg-gray-50 h-screen overflow-hidden flex flex-col font-['Outfit']">
            {/* --- NAVBAR --- */}
            <nav className="bg-white border-b px-4 sm:px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-50 relative h-16">
                <div className="flex items-center gap-4">
                    <Link to="/category" className="text-gray-400 hover:text-gray-800 transition"><i className="fa-solid fa-arrow-left"></i></Link>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="ALMA Logo" className="h-8 w-auto object-contain" />
                        <span className="font-bold text-lg md:text-xl text-gray-800 whitespace-nowrap hidden sm:block">ALMA Custom Threads<span className="text-blue-600">.</span></span>
                    </Link>
                    <span className="ml-4 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium border border-blue-100 hidden sm:block">Đang thiết kế: Áo Sơ Mi Lớp</span>
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
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-gray-50 border-2 border-blue-500 rounded-lg p-2 text-center cursor-pointer relative shadow-sm">
                                        <img src="/images/Phoi_ao/áo sơ mi.jpg" className="w-full aspect-square object-cover bg-white rounded" alt="Sơ mi" />
                                        <p className="text-[10px] font-bold mt-2 text-blue-600">Áo Sơ Mi Lớp</p>
                                        <i className="fa-solid fa-circle-check absolute -top-2 -right-2 text-blue-500 bg-white rounded-full text-sm"></i>
                                    </div>
                                </div>
                                <div className="w-full h-px bg-gray-200 mb-4"></div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Thư viện Icons <span className="text-blue-500 normal-case font-normal">(từ DB)</span></h4>
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
                                                <img src={icon.imageUrl} className="w-full aspect-square object-contain" alt={icon.name}
                                                    onError={(e) => (e.target as HTMLImageElement).src = '/images/placeholder.png'} />
                                                <p className="text-[9px] text-gray-500 truncate w-full text-center">{icon.name}</p>
                                                {icon.priceAddon > 0 && (
                                                    <span className="text-[9px] font-bold text-blue-600">+{icon.priceAddon.toLocaleString('vi-VN')}đ</span>
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

                        {/* TAB AI */}
                        {activeTab === 'ai' && (
                            <div>
                                <h4 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3 mt-2 flex items-center gap-2"><i className="fa-solid fa-sparkles"></i> AI Text-to-Image</h4>
                                <p className="text-xs text-gray-500 mb-4">Mô tả ý tưởng của bạn, AI sẽ tạo ra hình in độc nhất vô nhị.</p>
                                <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500" placeholder="Ví dụ: Phi hành gia lướt ván..."></textarea>
                                <button onClick={handleGenerateAI} disabled={isAiLoading} className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-3 rounded-lg shadow-sm transition flex justify-center gap-2 disabled:opacity-70">
                                    {isAiLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-wand-magic-sparkles"></i>} Tạo Họa Tiết
                                </button>
                                {aiResults.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Kết quả</h4>
                                        <div className="grid grid-cols-2 gap-3 pb-4">
                                            {aiResults.map((src, i) => (
                                                <img key={i} src={src} onClick={() => handleAddSticker(src)} className="w-full aspect-square object-contain border border-transparent hover:border-purple-500 rounded-lg cursor-pointer bg-white transition shadow-sm" alt="AI Result"/>
                                            ))}
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
                                    <div><label className="text-xs font-medium text-gray-600 block">Cỡ chữ</label><input type="number" id="text-size-input" defaultValue="28" className="w-full border rounded-lg p-2.5 text-sm"/></div>
                                    <div><label className="text-xs font-medium text-gray-600 block">Màu chữ</label><input type="color" id="text-color-input" defaultValue="#000000" className="w-full h-[42px] border rounded-lg cursor-pointer"/></div>
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
                            {/* Hình nền Áo */}
                            <img src={viewMode === 'front' ? "/images/Phoi_ao/Áo sơ mi mặt trước .jpg" : "/images/Phoi_ao/Áo sơ mi mặt sau .jpg"} alt="Áo" className="w-[85%] object-contain drop-shadow-2xl select-none relative z-10" draggable="false" />
                            
                            {/* Lớp Đổi Màu (Mix-blend-mode) */}
                            <div className="absolute z-[11] pointer-events-none" style={{ width: '85%', height: '100%', left: '50%', top: 0, transform: 'translateX(-50%)', backgroundColor: shirtColor, mixBlendMode: 'color', opacity: 0.65, borderRadius: '10%' }}></div>

                            {/* Khung vẽ Fabric.js */}
                            <div ref={wrapperRef} className="absolute w-[60%] h-[65%] top-[18%] left-[20%] z-20 border-2 border-dashed border-gray-400/40 rounded-md" style={{ display: viewMode === 'front' ? 'block' : 'none' }}>
                                <canvas ref={canvasRef}></canvas>
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
                            <p className="text-sm text-gray-800 mt-4 mb-3 font-semibold">Màu Nền Áo</p>
                            <div className="grid grid-cols-5 gap-2 mb-4">
                                {colors.map(c => (
                                    <div key={c.code} onClick={() => setShirtColor(c.code)} className={`w-8 h-8 rounded-full border-2 shadow-sm flex items-center justify-center cursor-pointer ${c.bgClass} ${shirtColor === c.code ? 'border-blue-500 scale-110' : 'border-gray-300 hover:scale-105'} transition-transform`}>
                                        {shirtColor === c.code && <i className={`fa-solid fa-check text-xs ${c.code === 'transparent' ? 'text-blue-500' : 'text-white'}`}></i>}
                                    </div>
                                ))}
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
                                            <div key={i} className="flex justify-between items-center text-sm bg-white border p-2 rounded shadow-sm mb-1 cursor-pointer hover:bg-blue-50" onClick={() => { fabricCanvas.current?.setActiveObject(obj); fabricCanvas.current?.renderAll(); }}>
                                                <span className="font-medium text-gray-800 truncate">
                                                    <i className={`fa-solid ${isText ? 'fa-t' : 'fa-image'} text-gray-400 mr-2`}></i>
                                                    {isText ? `"${obj.text?.substring(0, 10)}..."` : `Sticker ${i + 1}`}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); fabricCanvas.current?.remove(obj); fabricCanvas.current?.renderAll(); }} className="text-red-400 hover:text-red-600"><i className="fa-regular fa-trash-can"></i></button>
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