import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { orderApi } from '../api/orderApi';
import type { OrderDetailResponseDto } from '../types';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';

// Declare Leaflet types
declare global {
    interface Window {
        L: any;
    }
}


// Status styling configuration
interface StatusConfig {
    label: string;
    badge: string;
    glow: string;
    icon: string;
    bg: string;
    stepIndex: number;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
    Pending: {
        label: 'Chờ xác nhận',
        badge: 'bg-amber-100 text-amber-700 border-amber-300 shadow-amber-200/60',
        glow: 'border-amber-400',
        icon: 'fa-clock',
        bg: 'from-amber-50/40 to-transparent',
        stepIndex: 1,
    },
    Processing: {
        label: 'Đang xử lý',
        badge: 'bg-blue-100 text-blue-700 border-blue-300 shadow-blue-200/60',
        glow: 'border-blue-400',
        icon: 'fa-hourglass-half',
        bg: 'from-blue-50/40 to-transparent',
        stepIndex: 2,
    },
    Confirmed: {
        label: 'Đã xác nhận',
        badge: 'bg-sky-100 text-sky-700 border-sky-300 shadow-sky-200/60',
        glow: 'border-sky-400',
        icon: 'fa-circle-check',
        bg: 'from-sky-50/40 to-transparent',
        stepIndex: 3,
    },
    Shipping: {
        label: 'Đang giao hàng',
        badge: 'bg-violet-100 text-violet-700 border-violet-300 shadow-violet-200/60',
        glow: 'border-violet-400',
        icon: 'fa-truck-fast',
        bg: 'from-violet-50/40 to-transparent',
        stepIndex: 4,
    },
    Delivered: {
        label: 'Đã giao thành công',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-emerald-200/60',
        glow: 'border-emerald-400',
        icon: 'fa-box-open',
        bg: 'from-emerald-50/40 to-transparent',
        stepIndex: 5,
    },
    Cancelled: {
        label: 'Đã hủy đơn',
        badge: 'bg-red-100 text-red-600 border-red-300 shadow-red-200/60',
        glow: 'border-red-400',
        icon: 'fa-ban',
        bg: 'from-red-50/30 to-transparent',
        stepIndex: 0,
    },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
    Pending: { label: 'Chờ thanh toán', color: 'text-amber-600', icon: 'fa-clock' },
    Paid: { label: 'Đã thanh toán', color: 'text-emerald-600', icon: 'fa-circle-check' },
    Failed: { label: 'Thất bại', color: 'text-red-500', icon: 'fa-xmark-circle' },
    Refunded: { label: 'Đã hoàn tiền', color: 'text-slate-500', icon: 'fa-rotate-left' },
};

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDetailResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal state for changing shipping address
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        shipName: '',
        shipPhone: '',
        shipAddress: '',
        shipProvince: '',
    });

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const data = await orderApi.getOrderDetail(Number(id));
            setOrder(data);
            setEditForm({
                shipName: data.shipName,
                shipPhone: data.shipPhone,
                shipAddress: data.shipAddress,
                shipProvince: data.shipProvince,
            });
            setOsmSearch(data.shipAddress);
        } catch {
            toast.error('Không thể tải chi tiết đơn hàng.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    // Handle cancel order
    const handleCancelOrder = async () => {
        if (!order) return;
        const confirmCancel = window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?');
        if (!confirmCancel) return;

        setActionLoading(true);
        try {
            await orderApi.cancelOrder(order.orderId);
            toast.success('Hủy đơn hàng thành công!');
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng.');
        } finally {
            setActionLoading(false);
        }
    };

    // Leaflet + OpenStreetMap (OSM) Map State & Refs
    const [leafletReady, setLeafletReady] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [modalCoords, setModalCoords] = useState<{ lat: number, lng: number }>({ lat: 21.0285, lng: 105.8542 });
    const [osmSuggestions, setOsmSuggestions] = useState<any[]>([]);
    const [osmSearch, setOsmSearch] = useState('');
    const [osmLoading, setOsmLoading] = useState(false);

    // ── Geocoding & Nominatim Helper Functions ────────────────────────────────
    const reverseGeocode = async (lat: number, lng: number, updateCallback: (address: string, province: string) => void) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
                headers: { 'Accept-Language': 'vi' }
            });
            const data = await response.json();
            if (data && data.display_name) {
                const fullAddress = data.display_name;
                let province = "";
                if (data.address) {
                    province = data.address.city || data.address.town || data.address.municipality || data.address.state || "";
                }
                updateCallback(fullAddress, province || fullAddress);
            }
        } catch (err) {
            console.error("Reverse geocoding error:", err);
        }
    };

    const geocodeAddress = async (address: string) => {
        if (!address) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=vn&limit=1&addressdetails=1`, {
                headers: { 'Accept-Language': 'vi' }
            });
            const data = await response.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setModalCoords({ lat, lng });
                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView([lat, lng], 16);
                    markerRef.current.setLatLng([lat, lng]);
                }
            }
        } catch (err) {
            console.error("Geocoding existing address error:", err);
        }
    };

    const handleOsmSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setOsmSearch(val);

        if (val.trim().length < 3) {
            setOsmSuggestions([]);
            return;
        }

        setOsmLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=vn&limit=5&addressdetails=1`, {
                headers: { 'Accept-Language': 'vi' }
            });
            const data = await response.json();
            setOsmSuggestions(data || []);
        } catch (err) {
            console.error("OSM search error:", err);
        } finally {
            setOsmLoading(false);
        }
    };

    const handleOsmSelect = (item: any) => {
        const fullAddress = item.display_name;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        
        let province = "";
        if (item.address) {
            province = item.address.city || item.address.town || item.address.municipality || item.address.state || "";
        }
        
        setEditForm(prev => ({
            ...prev,
            shipAddress: fullAddress,
            shipProvince: province || fullAddress,
        }));
        
        setOsmSearch(fullAddress);
        setOsmSuggestions([]);
        setModalCoords({ lat, lng });

        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
        }
    };

    const initLeafletMap = useCallback(() => {
        if (!window.L || !mapContainerRef.current) return;

        try {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }

            const map = window.L.map(mapContainerRef.current, {
                center: [modalCoords.lat, modalCoords.lng],
                zoom: 16,
                zoomControl: true,
                attributionControl: false
            });
            mapRef.current = map;

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            const redIcon = window.L.divIcon({
                html: `<div style="display: flex; justify-content: center; align-items: center; width: 40px; height: 40px;">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EF4444"/>
                        <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
                    </svg>
                </div>`,
                className: 'custom-pin-modal',
                iconSize: [40, 40],
                iconAnchor: [20, 40]
            });

            const marker = window.L.marker([modalCoords.lat, modalCoords.lng], {
                draggable: true,
                icon: redIcon
            }).addTo(map);
            markerRef.current = marker;

            const onDragEnd = async () => {
                const position = marker.getLatLng();
                setModalCoords({ lat: position.lat, lng: position.lng });
                await reverseGeocode(position.lat, position.lng, (address, province) => {
                    setEditForm(prev => ({
                        ...prev,
                        shipAddress: address,
                        shipProvince: province
                    }));
                    setOsmSearch(address);
                });
            };

            marker.on('dragend', onDragEnd);

            map.on('click', async (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                setModalCoords({ lat, lng });
                await reverseGeocode(lat, lng, (address, province) => {
                    setEditForm(prev => ({
                        ...prev,
                        shipAddress: address,
                        shipProvince: province
                    }));
                    setOsmSearch(address);
                });
            });

            setMapReady(true);
        } catch (err) {
            console.error("Error initializing Leaflet modal map:", err);
        }
    }, [modalCoords]);

    const handleGPSLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Trình duyệt của bạn không hỗ trợ định vị GPS!");
            return;
        }

        const toastId = toast.loading("Đang xác định vị trí GPS của bạn...");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                toast.dismiss(toastId);
                toast.success("Định vị GPS thành công!");

                setModalCoords({ lat, lng });

                if (mapRef.current && markerRef.current) {
                    mapRef.current.setView([lat, lng], 16);
                    markerRef.current.setLatLng([lat, lng]);
                }

                await reverseGeocode(lat, lng, (address, province) => {
                    setEditForm(prev => ({
                        ...prev,
                        shipAddress: address,
                        shipProvince: province
                    }));
                    setOsmSearch(address);
                });
            },
            (error) => {
                toast.dismiss(toastId);
                console.error("GPS error:", error);
                if (error.code === 1) {
                    toast.error("Vui lòng cấp quyền truy cập vị trí trên trình duyệt!");
                } else {
                    toast.error("Không thể xác định vị trí GPS. Vui lòng gõ địa chỉ tìm kiếm!");
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Load Leaflet resources dynamically
    useEffect(() => {
        if (!isEditModalOpen) {
            setMapReady(false);
            return;
        }

        // Inject Leaflet CSS
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Inject Leaflet JS
        const existingScript = document.getElementById("leaflet-js");
        if (existingScript) {
            if (window.L) {
                setLeafletReady(true);
            } else {
                const handleLoad = () => setLeafletReady(true);
                existingScript.addEventListener("load", handleLoad);
                return () => {
                    existingScript.removeEventListener("load", handleLoad);
                };
            }
        } else {
            const script = document.createElement("script");
            script.id = "leaflet-js";
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.async = true;
            script.onload = () => {
                setLeafletReady(true);
            };
            script.onerror = () => {
                console.error("Failed to load Leaflet script.");
            };
            document.head.appendChild(script);
        }
    }, [isEditModalOpen]);

    // Geocode existing address when modal is opened to properly center
    useEffect(() => {
        if (isEditModalOpen) {
            geocodeAddress(editForm.shipAddress);
        }
    }, [isEditModalOpen]);

    // Initializer map hook
    useEffect(() => {
        if (isEditModalOpen && leafletReady && !mapReady) {
            const timer = setTimeout(() => {
                initLeafletMap();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isEditModalOpen, leafletReady, mapReady, initLeafletMap]);


    // Save edited address details
    const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!order) return;

        if (!editForm.shipName || !editForm.shipPhone || !editForm.shipAddress || !editForm.shipProvince) {
            toast.error('Vui lòng nhập đầy đủ thông tin nhận hàng.');
            return;
        }

        setActionLoading(true);
        try {
            await orderApi.updateShippingAddress(order.orderId, editForm);
            toast.success('Cập nhật địa chỉ thành công!');
            setIsEditModalOpen(false);
            fetchDetail();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể cập nhật địa chỉ.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Đang tải chi tiết đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-triangle-exclamation text-2xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Không tìm thấy đơn hàng</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">Đơn hàng không tồn tại hoặc bạn không có quyền xem chi tiết đơn hàng này.</p>
                <button onClick={() => navigate('/orders')} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const sc = STATUS_CONFIGS[order.orderStatus] || STATUS_CONFIGS.Pending;
    const pc = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: 'text-gray-500', icon: 'fa-question-circle' };
    const dateFormatted = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '—';
    const isCancelled = order.orderStatus === 'Cancelled';

    return (
        <div className="max-w-4xl mx-auto space-y-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white rounded-2xl p-6 border border-gray-100 shadow-sm gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold uppercase tracking-widest">
                        <span onClick={() => navigate('/orders')} className="hover:text-blue-600 cursor-pointer transition-colors">Đơn hàng</span>
                        <span>/</span>
                        <span className="text-gray-600">Chi tiết</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        Đơn hàng #{order.orderCode}
                    </h2>
                    <p className="text-xs text-gray-500">Ngày đặt hàng: {dateFormatted}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 shadow-sm ${sc.badge}`}>
                        <i className={`fa-solid ${sc.icon}`} />
                        {sc.label}
                    </span>
                    {order.orderStatus === 'Pending' && (
                        <>
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-pen-to-square" />
                                Thay đổi địa chỉ
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={actionLoading}
                                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                <i className="fa-solid fa-trash-can" />
                                Hủy đơn hàng
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Status Timeline */}
            {!isCancelled && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i className="fa-solid fa-timeline text-blue-500" /> Hành trình đơn hàng
                    </h3>
                    <div className="flex justify-between items-center relative py-2 select-none overflow-x-auto min-w-[500px] no-scrollbar">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${((sc.stepIndex - 1) / 4) * 100}%` }}
                        />

                        {/* Step Dots */}
                        {['Pending', 'Processing', 'Confirmed', 'Shipping', 'Delivered'].map((statusKey) => {
                            const cfg = STATUS_CONFIGS[statusKey];
                            const isActive = sc.stepIndex >= cfg.stepIndex;
                            const isCurrent = sc.stepIndex === cfg.stepIndex;

                            return (
                                <div key={statusKey} className="relative z-10 flex flex-col items-center flex-1">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-md transition-all duration-300
                                            ${isActive
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent scale-110'
                                                : 'bg-white text-gray-400 border-gray-200'
                                            } ${isCurrent ? 'ring-4 ring-blue-500/20' : ''}`}
                                    >
                                        <i className={`fa-solid ${cfg.icon} text-xs`} />
                                    </div>
                                    <span className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {cfg.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Delivery & Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shipping Details */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
                        <i className="fa-solid fa-truck text-blue-500" /> Thông tin nhận hàng
                    </h3>
                    <div className="space-y-2.5 text-sm text-gray-600">
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Họ và tên:</span>
                            <span className="font-semibold text-gray-800 text-right">{order.shipName}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Số điện thoại:</span>
                            <span className="font-semibold text-gray-800 text-right">{order.shipPhone}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Tỉnh/Thành phố:</span>
                            <span className="font-semibold text-gray-800 text-right">{order.shipProvince}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Địa chỉ cụ thể:</span>
                            <span className="font-semibold text-gray-800 text-right leading-snug">{order.shipAddress}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-50 pb-3 flex items-center gap-2">
                        <i className="fa-solid fa-credit-card text-blue-500" /> Thông tin thanh toán
                    </h3>
                    <div className="space-y-2.5 text-sm text-gray-600">
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Phương thức:</span>
                            <span className="font-semibold text-gray-800 text-right">
                                {order.paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Thanh toán COD'}
                            </span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Trạng thái thanh toán:</span>
                            <span className={`font-bold flex items-center gap-1.5 ${pc.color}`}>
                                <i className={`fa-solid ${pc.icon} text-xs`} />
                                {pc.label}
                            </span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-gray-400 font-medium shrink-0">Phí vận chuyển:</span>
                            <span className="font-semibold text-gray-800 text-right">{Number(order.shippingFee).toLocaleString('vi-VN')}đ</span>
                        </div>
                        {order.voucherCode && (
                            <div className="flex justify-between items-start gap-4">
                                <span className="text-gray-400 font-medium shrink-0">Mã giảm giá đã dùng:</span>
                                <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 text-xs">
                                    {order.voucherCode}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ordered Items list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <i className="fa-solid fa-shirt text-blue-500" /> Danh sách sản phẩm
                    </h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {order.items.map((item) => (
                        <div key={item.orderItemId} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="w-16 h-16 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                {item.imageUrl ? (
                                    <img src={resolveApiAssetUrl(item.imageUrl)} alt={item.itemName} className="w-full h-full object-contain" />
                                ) : (
                                    <i className="fa-solid fa-shirt text-gray-300 text-2xl" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm leading-snug mb-1 truncate">{item.itemName}</h4>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
                                    <span>Size: <strong className="text-gray-700">{item.size}</strong></span>
                                    <span>Số lượng: <strong className="text-gray-700">{item.quantity}</strong></span>
                                    {item.isCustomDesign && (
                                        <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] font-bold">✨ Tự thiết kế</span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right sm:text-right w-full sm:w-auto mt-2 sm:mt-0 font-bold text-gray-900 text-sm">
                                {(Number(item.unitPrice) * item.quantity).toLocaleString('vi-VN')}đ
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-50/50 border-t border-gray-100 p-6 space-y-3.5 text-sm text-gray-600">
                    <div className="flex justify-between">
                        <span>Tiền hàng tạm tính:</span>
                        <span className="font-semibold text-gray-800">{(Number(order.totalAmount) - Number(order.shippingFee) + Number(order.discountAmount)).toLocaleString('vi-VN')}đ</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Phí giao hàng:</span>
                        <span className="font-semibold text-gray-800">+{Number(order.shippingFee).toLocaleString('vi-VN')}đ</span>
                    </div>
                    {Number(order.discountAmount) > 0 && (
                        <div className="flex justify-between text-green-600 font-medium">
                            <span>Giảm giá (Voucher):</span>
                            <span>-{Number(order.discountAmount).toLocaleString('vi-VN')}đ</span>
                        </div>
                    )}
                    <div className="border-t border-gray-200/60 pt-4 flex justify-between items-center">
                        <span className="text-base font-extrabold text-gray-900">Tổng thanh toán:</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[10px] font-bold text-gray-400">VND</span>
                            <span className="text-xl font-black text-gray-900">{Number(order.totalAmount).toLocaleString('vi-VN')}đ</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back button */}
            <div className="flex justify-start">
                <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 font-bold px-5 py-3 rounded-2xl shadow-sm text-sm transition-all"
                >
                    <i className="fa-solid fa-arrow-left" />
                    Quay lại danh sách đơn hàng
                </button>
            </div>

            {/* sleeker Edit Address Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 relative">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <i className="fa-solid fa-location-dot text-blue-500" />
                                Sửa địa chỉ nhận hàng
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                                ✕
                            </button>
                        </div>

                        {/* Modal Body / Scrollable Form */}
                        <form onSubmit={handleSaveAddress} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Họ và tên</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.shipName}
                                        onChange={(e) => setEditForm({ ...editForm, shipName: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Số điện thoại</label>
                                    <input
                                        type="tel"
                                        required
                                        value={editForm.shipPhone}
                                        onChange={(e) => setEditForm({ ...editForm, shipPhone: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                {/* Map Integrations using Leaflet + OpenStreetMap */}
                                <div className="sm:col-span-2 space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-900 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                        <p className="font-bold flex items-center gap-2 text-blue-900 text-sm">
                                            <i className="fa-solid fa-map-location-dot text-blue-500"></i>
                                            Định vị thông minh qua OpenStreetMap
                                        </p>
                                        <p className="mt-1 text-[11px] text-blue-700 leading-relaxed">
                                            Hệ thống tự động điền địa chỉ. Bạn có thể gõ để tìm kiếm địa chỉ nhanh hoặc kéo ghim trên bản đồ để xác định vị trí chính xác:
                                        </p>
                                        
                                        <div className="mt-3 relative">
                                            <input
                                                type="text"
                                                value={osmSearch}
                                                onChange={handleOsmSearchChange}
                                                placeholder={leafletReady ? "Gõ tìm tên đường, địa danh để tìm địa chỉ..." : "Đang tải bản đồ..."}
                                                className="w-full border border-blue-200 rounded-xl px-4 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400"
                                                disabled={!leafletReady}
                                            />
                                            {osmLoading && (
                                                <span className="absolute right-3 top-3 text-blue-500">
                                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                                </span>
                                            )}
                                            
                                            {osmSuggestions.length > 0 && (
                                                <div className="absolute left-0 right-0 z-[1000] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-40 overflow-y-auto divide-y divide-gray-100">
                                                    {osmSuggestions.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleOsmSelect(item)}
                                                            className="px-4 py-2.5 hover:bg-blue-50 text-gray-700 text-xs cursor-pointer transition-colors flex items-start gap-2"
                                                        >
                                                            <i className="fa-solid fa-location-dot text-blue-500 mt-0.5"></i>
                                                            <span>{item.display_name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modal Map Canvas */}
                                    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
                                        <div
                                            ref={mapContainerRef}
                                            style={{ width: '100%', height: '200px' }}
                                        />
                                        {mapReady && (
                                            <button
                                                type="button"
                                                onClick={handleGPSLocation}
                                                className="absolute bottom-3 right-3 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-[400] border border-blue-500/20"
                                                title="Sử dụng GPS hiện tại"
                                            >
                                                <i className="fa-solid fa-location-crosshairs text-sm"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Địa chỉ nhận hàng</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.shipAddress}
                                        onChange={(e) => setEditForm({ ...editForm, shipAddress: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tỉnh / Thành phố</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.shipProvince}
                                        onChange={(e) => setEditForm({ ...editForm, shipProvince: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Actions footer inside body to keep in scroll */}
                            <div className="border-t border-gray-150 pt-5 flex justify-end gap-3.5">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                                >
                                    Đóng
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                                >
                                    {actionLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
