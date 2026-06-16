import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient, { resolveApiAssetUrl } from "../../../shared/api/axiosClient";
import { cartApi } from "../../cart/api/cartApi";
import type { CartResponseDto } from "../../cart/types/index";
import { useAuth } from "../../auth/context/AuthContext";
import type { AddressDto } from "../../../shared/types/auth.types";

// Declare Leaflet types
declare global {
    interface Window {
        L: any;
    }
}

const CheckoutPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // ── Giỏ hàng từ API ──────────────────────────────────────────────────────
    const [cart, setCart] = useState<CartResponseDto | null>(null);
    const [cartLoading, setCartLoading] = useState(true);

    useEffect(() => {
        cartApi.getMyCart()
            .then(setCart)
            .catch(() => toast.error("Không thể tải giỏ hàng."))
            .finally(() => setCartLoading(false));
    }, []);

    // ── State form ────────────────────────────────────────────────────────────
    const [shippingInfo, setShippingInfo] = useState({
        email: "",
        shipName: "",
        shipPhone: "",
        shipAddress: "",
        shipProvince: "",
    });

    // ── Saved Addresses state ─────────────────────────────────────────────────
    const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
    const [showAddressPicker, setShowAddressPicker] = useState(false);

    // Helper: geocode an address string and update mini-map marker
    const geocodeAndUpdateMiniMap = useCallback(async (addressText: string) => {
        try {
            const results = await searchGeocodeSuggestions(addressText);
            if (results.length > 0) {
                const best = results[0];
                const lat = parseFloat(best.lat);
                const lng = parseFloat(best.lon);
                if (!isNaN(lat) && !isNaN(lng)) {
                    setModalCoords({ lat, lng });
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([lat, lng], 16);
                        markerRef.current.setLatLng([lat, lng]);
                    }
                }
            }
        } catch (err) {
            console.warn('Geocode for mini-map failed:', err);
        }
    }, []);

    // Auto-populate from default saved address and user email
    useEffect(() => {
        if (!user) return;
        setShippingInfo(prev => ({ ...prev, email: prev.email || user.email }));

        axiosClient.get<AddressDto[]>('/profile/addresses')
            .then(res => {
                const list = res.data || [];
                setSavedAddresses(list);
                const defaultAddr = list.find(a => a.isDefault);
                if (defaultAddr) {
                    const fullAddr = `${defaultAddr.addressLine}, ${defaultAddr.district}, ${defaultAddr.province}`;
                    setShippingInfo(prev => ({
                        ...prev,
                        shipName: prev.shipName || defaultAddr.fullName,
                        shipPhone: prev.shipPhone || defaultAddr.phone,
                        shipAddress: prev.shipAddress || fullAddr,
                        shipProvince: prev.shipProvince || defaultAddr.province,
                    }));
                    setMiniMapSearch(fullAddr);
                    // Geocode to update map marker position
                    geocodeAndUpdateMiniMap(fullAddr);
                }
            })
            .catch(err => console.warn('Could not load saved addresses:', err));
    }, [user, geocodeAndUpdateMiniMap]);

    const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "COD">("VIETQR");

    // ── QR Modal state ────────────────────────────────────────────────────────
    const [qrData, setQrData] = useState<{ isOpen: boolean; url: string; orderId: number | null; amount: number }>({
        isOpen: false,
        url: "",
        orderId: null,
        amount: 0,
    });

    const [isPaid, setIsPaid] = useState(false);

    const [changingPaymentMethod, setChangingPaymentMethod] = useState(false);

    // ── Voucher states & handlers ─────────────────────────────────────────────
    const [voucherCode, setVoucherCode] = useState("");
    const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [isFreeShipping, setIsFreeShipping] = useState(false);
    const [voucherMessage, setVoucherMessage] = useState("");
    const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) return;
        setIsValidatingVoucher(true);
        setVoucherMessage("");
        try {
            const response = await axiosClient.get(`/order/check-voucher?code=${encodeURIComponent(voucherCode.trim())}`);
            const data = response.data;
            if (data.isValid) {
                setAppliedVoucherCode(voucherCode.trim());
                setVoucherDiscount(data.discountAmount || 0);
                setIsFreeShipping(data.isFreeShipping || false);
                setVoucherMessage(data.message || "Áp dụng mã thành công!");
                toast.success("Đã áp dụng mã giảm giá!");
            } else {
                setVoucherMessage(data.message || "Mã giảm giá không hợp lệ.");
                toast.error(data.message || "Mã giảm giá không hợp lệ.");
            }
        } catch (error: any) {
            const msg = error.response?.data?.message ?? "Mã giảm giá không hợp lệ hoặc không đủ điều kiện.";
            setVoucherMessage(msg);
            toast.error(msg);
        } finally {
            setIsValidatingVoucher(false);
        }
    };

    const handleRemoveVoucher = () => {
        setVoucherCode("");
        setAppliedVoucherCode("");
        setVoucherDiscount(0);
        setIsFreeShipping(false);
        setVoucherMessage("");
        toast.success("Đã hủy áp dụng mã giảm giá.");
    };

    // ── Leaflet + OpenStreetMap (OSM) Map State & Refs ──────────────────────────
    const [leafletReady, setLeafletReady] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const miniMapTimeoutRef = useRef<any>(null);

    // Mini-map autocomplete states
    const [miniMapSearch, setMiniMapSearch] = useState("");
    const [miniMapSuggestions, setMiniMapSuggestions] = useState<any[]>([]);
    const [miniMapLoading, setMiniMapLoading] = useState(false);

    // ── Map Modal states & refs ───────────────────────────────────────
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [modalAddress, setModalAddress] = useState("");
    const [modalProvince, setModalProvince] = useState("");
    const [modalCoords, setModalCoords] = useState<{ lat: number, lng: number }>({ lat: 21.0285, lng: 105.8542 });
    const [modalMapReady, setModalMapReady] = useState(false);

    const modalMapContainerRef = useRef<HTMLDivElement>(null);
    const modalMapRef = useRef<any>(null);
    const modalMarkerRef = useRef<any>(null);
    const modalTimeoutRef = useRef<any>(null);

    // Modal search states
    const [modalSearch, setModalSearch] = useState("");
    const [modalSuggestions, setModalSuggestions] = useState<any[]>([]);
    const [modalLoading, setModalLoading] = useState(false);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (miniMapTimeoutRef.current) clearTimeout(miniMapTimeoutRef.current);
            if (modalTimeoutRef.current) clearTimeout(modalTimeoutRef.current);
        };
    }, []);

    // ── Geocoding & Nominatim Helper Functions ────────────────────────────────
    // ── Geocoding & Nominatim Helper Functions ────────────────────────────────
    const reverseGeocode = async (lat: number, lng: number, updateCallback: (address: string, province: string) => void) => {
        // Thử Nominatim trước
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&email=son.bafpt@gmail.com`, {
                headers: { 'Accept-Language': 'vi' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const data = await response.json();
                if (data && data.display_name) {
                    const fullAddress = data.display_name;
                    let province = "";
                    if (data.address) {
                        province = data.address.city || data.address.town || data.address.municipality || data.address.state || "";
                    }
                    updateCallback(fullAddress, province || fullAddress);
                    return;
                }
            }
        } catch (err: any) {
            console.warn("Nominatim reverse geocoding failed:", err?.name === 'AbortError' ? 'Timeout' : err);
        }

        // Đợi 1 giây trước khi thử fallback (tránh rate limit)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fallback: dùng Photon
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const response = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (response.ok) {
                const geojson = await response.json();
                if (geojson && Array.isArray(geojson.features) && geojson.features.length > 0) {
                    const feat = geojson.features[0];
                    const props = feat.properties || {};
                    
                    const parts = [];
                    if (props.name) parts.push(props.name);
                    if (props.housenumber) parts[parts.length - 1] = `${props.housenumber} ${parts[parts.length - 1] || ""}`.trim();
                    if (props.street) parts.push(props.street);
                    if (props.locality) parts.push(props.locality);
                    if (props.district) parts.push(props.district);
                    if (props.city || props.town) parts.push(props.city || props.town);
                    if (props.state) parts.push(props.state);
                    if (props.country) parts.push(props.country);
                    
                    const fullAddress = parts.filter(Boolean).join(", ");
                    const province = props.city || props.town || props.state || "";
                    
                    updateCallback(fullAddress, province || fullAddress);
                    return;
                }
            }
        } catch (err: any) {
            console.error("Photon reverse geocoding also failed:", err?.name === 'AbortError' ? 'Timeout' : err);
        }
    };

    const searchGeocodeSuggestions = async (query: string): Promise<any[]> => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1&email=son.bafpt@gmail.com`, {
                headers: { 'Accept-Language': 'vi' }
            });
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) return data;
            }
        } catch (err) {
            console.warn("Primary search geocoding failed, trying Photon fallback:", err);
        }

        try {
            const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
            if (response.ok) {
                const geojson = await response.json();
                if (geojson && Array.isArray(geojson.features)) {
                    return geojson.features.map((feat: any) => {
                        const props = feat.properties || {};
                        const coords = feat.geometry?.coordinates || [0, 0];
                        
                        const parts = [];
                        if (props.name) parts.push(props.name);
                        if (props.housenumber) parts[parts.length - 1] = `${props.housenumber} ${parts[parts.length - 1] || ""}`.trim();
                        if (props.street) parts.push(props.street);
                        if (props.locality) parts.push(props.locality);
                        if (props.district) parts.push(props.district);
                        if (props.city || props.town) parts.push(props.city || props.town);
                        if (props.state) parts.push(props.state);
                        if (props.country) parts.push(props.country);
                        
                        const displayName = parts.filter(Boolean).join(", ");
                        
                        return {
                            display_name: displayName,
                            lat: coords[1].toString(),
                            lon: coords[0].toString(),
                            address: {
                                city: props.city || props.town || "",
                                town: props.town || "",
                                state: props.state || "",
                                country: props.country || "",
                            }
                        };
                    });
                }
            }
        } catch (err) {
            console.error("Geocoding search fallback failed:", err);
        }
        return [];
    };

    const handleMiniMapSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMiniMapSearch(val);

        if (val.trim().length < 3) {
            setMiniMapSuggestions([]);
            return;
        }

        if (miniMapTimeoutRef.current) {
            clearTimeout(miniMapTimeoutRef.current);
        }

        setMiniMapLoading(true);
        miniMapTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchGeocodeSuggestions(val);
                setMiniMapSuggestions(results);
            } catch (err) {
                console.error("MiniMap search error:", err);
            } finally {
                setMiniMapLoading(false);
            }
        }, 600);
    };

    const handleMiniMapSelect = (item: any) => {
        const fullAddress = item.display_name;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        
        let province = "";
        if (item.address) {
            province = item.address.city || item.address.town || item.address.municipality || item.address.state || "";
        }
        
        setShippingInfo(prev => ({
            ...prev,
            shipAddress: fullAddress,
            shipProvince: province || fullAddress,
        }));
        
        setMiniMapSearch(fullAddress);
        setMiniMapSuggestions([]);
        setModalCoords({ lat, lng });

        // Update map view
        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
        }
    };

    const handleModalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setModalSearch(val);

        if (val.trim().length < 3) {
            setModalSuggestions([]);
            return;
        }

        if (modalTimeoutRef.current) {
            clearTimeout(modalTimeoutRef.current);
        }

        setModalLoading(true);
        modalTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await searchGeocodeSuggestions(val);
                setModalSuggestions(results);
            } catch (err) {
                console.error("Modal search error:", err);
            } finally {
                setModalLoading(false);
            }
        }, 600);
    };

    const handleModalSelect = (item: any) => {
        const fullAddress = item.display_name;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        
        let province = "";
        if (item.address) {
            province = item.address.city || item.address.town || item.address.municipality || item.address.state || "";
        }
        
        setModalAddress(fullAddress);
        setModalProvince(province || fullAddress);
        setModalCoords({ lat, lng });
        setModalSearch(fullAddress);
        setModalSuggestions([]);

        // Update modal map view
        if (modalMapRef.current && modalMarkerRef.current) {
            modalMapRef.current.setView([lat, lng], 16);
            modalMarkerRef.current.setLatLng([lat, lng]);
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
                zoom: 13,
                zoomControl: true,
                attributionControl: false
            });
            mapRef.current = map;

            window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(map);

            const redIcon = window.L.divIcon({
                html: `<div style="display: flex; justify-content: center; align-items: center; width: 40px; height: 40px;">
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EF4444"/>
                        <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
                    </svg>
                </div>`,
                className: 'custom-pin',
                iconSize: [36, 36],
                iconAnchor: [18, 36]
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
                    setShippingInfo(prev => ({
                        ...prev,
                        shipAddress: address,
                        shipProvince: province
                    }));
                    setMiniMapSearch(address);
                });
            };

            marker.on('dragend', onDragEnd);

            map.on('click', async (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                setModalCoords({ lat, lng });
                await reverseGeocode(lat, lng, (address, province) => {
                    setShippingInfo(prev => ({
                        ...prev,
                        shipAddress: address,
                        shipProvince: province
                    }));
                    setMiniMapSearch(address);
                });
            });

            setMapReady(true);
        } catch (err) {
            console.error("Error initializing Leaflet mini-map:", err);
        }
    }, [modalCoords]);

    const initLeafletMapModal = useCallback(() => {
        if (!window.L || !modalMapContainerRef.current) return;

        try {
            if (modalMapRef.current) {
                modalMapRef.current.remove();
                modalMapRef.current = null;
            }

            const map = window.L.map(modalMapContainerRef.current, {
                center: [modalCoords.lat, modalCoords.lng],
                zoom: 16,
                zoomControl: true,
                attributionControl: false
            });
            modalMapRef.current = map;

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
            modalMarkerRef.current = marker;

            const onDragEnd = async () => {
                const position = marker.getLatLng();
                setModalCoords({ lat: position.lat, lng: position.lng });
                await reverseGeocode(position.lat, position.lng, (address, province) => {
                    setModalAddress(address);
                    setModalProvince(province);
                    setModalSearch(address);
                });
            };

            marker.on('dragend', onDragEnd);

            map.on('click', async (e: any) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                setModalCoords({ lat, lng });
                await reverseGeocode(lat, lng, (address, province) => {
                    setModalAddress(address);
                    setModalProvince(province);
                    setModalSearch(address);
                });
            });

            setModalMapReady(true);
        } catch (err) {
            console.error("Error initializing Leaflet modal map:", err);
        }
    }, [modalCoords]);

    const handleGPSLocation = (isModal: boolean) => {
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

                // Luôn cập nhật bản đồ trước (không phụ thuộc reverse geocode)
                if (isModal) {
                    if (modalMapRef.current && modalMarkerRef.current) {
                        modalMapRef.current.setView([lat, lng], 16);
                        modalMarkerRef.current.setLatLng([lat, lng]);
                    }
                } else {
                    if (mapRef.current && markerRef.current) {
                        mapRef.current.setView([lat, lng], 16);
                        markerRef.current.setLatLng([lat, lng]);
                    }
                }

                // Thử reverse geocode để lấy địa chỉ text
                const geocodeToastId = toast.loading("Đang lấy thông tin địa chỉ...");
                let geocodeSuccess = false;

                const updateAddress = (address: string, province: string) => {
                    geocodeSuccess = true;
                    if (isModal) {
                        setModalAddress(address);
                        setModalProvince(province);
                        setModalSearch(address);
                    } else {
                        setShippingInfo(prev => ({
                            ...prev,
                            shipAddress: address,
                            shipProvince: province
                        }));
                        setMiniMapSearch(address);
                    }
                };

                // Thử reverse geocode (đã có fallback Nominatim → Photon bên trong)
                await reverseGeocode(lat, lng, updateAddress);

                toast.dismiss(geocodeToastId);
                if (geocodeSuccess) {
                    toast.success("Đã tìm được địa chỉ!");
                } else {
                    // Nếu cả 2 API đều thất bại → điền tọa độ vào địa chỉ để user biết vị trí
                    const coordsText = `Vị trí GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    if (isModal) {
                        setModalAddress(coordsText);
                        setModalSearch(coordsText);
                    } else {
                        setShippingInfo(prev => ({
                            ...prev,
                            shipAddress: coordsText,
                        }));
                        setMiniMapSearch(coordsText);
                    }
                    toast("Đã định vị trên bản đồ! Bạn có thể nhập địa chỉ chi tiết bằng tay hoặc kéo ghim trên bản đồ.", {
                        icon: "📍",
                        duration: 5000,
                    });
                }
            },
            (error) => {
                toast.dismiss(toastId);
                console.error("GPS error:", error);
                if (error.code === 1) {
                    toast.error("Vui lòng cấp quyền truy cập vị trí trên trình duyệt!");
                } else if (error.code === 2) {
                    toast.error("Không thể xác định vị trí. Hãy thử dùng ô tìm kiếm để nhập địa chỉ.");
                } else if (error.code === 3) {
                    toast.error("Hết thời gian chờ định vị. Hãy thử lại hoặc tìm kiếm địa chỉ.");
                } else {
                    toast.error("Không thể xác định vị trí GPS. Vui lòng gõ địa chỉ tìm kiếm!");
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
        );
    };

    const handleConfirmModalLocation = () => {
        if (!modalAddress) {
            toast.error("Vui lòng chọn hoặc định vị một địa điểm trước khi xác nhận!");
            return;
        }

        setShippingInfo(prev => ({
            ...prev,
            shipAddress: modalAddress,
            shipProvince: modalProvince || prev.shipProvince,
        }));

        setMiniMapSearch(modalAddress);

        if (mapRef.current && markerRef.current) {
            mapRef.current.setView([modalCoords.lat, modalCoords.lng], 16);
            markerRef.current.setLatLng([modalCoords.lat, modalCoords.lng]);
        }

        setIsMapModalOpen(false);
        toast.success("Đã tự động cập nhật địa chỉ từ bản đồ!");
    };

    // Load Leaflet resources dynamically
    useEffect(() => {
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
    }, []);

    // Mini-map initialization hook
    useEffect(() => {
        if (leafletReady && !mapReady) {
            const timer = setTimeout(() => {
                initLeafletMap();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [leafletReady, mapReady, initLeafletMap]);

    // Modal map initialization hook
    useEffect(() => {
        if (isMapModalOpen && leafletReady && !modalMapReady) {
            const timer = setTimeout(() => {
                initLeafletMapModal();
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isMapModalOpen, leafletReady, modalMapReady, initLeafletMapModal]);

    useEffect(() => {
        if (!isMapModalOpen) {
            setModalMapReady(false);
        } else {
            setModalSearch(modalAddress || shippingInfo.shipAddress);
        }
    }, [isMapModalOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
    };

    // ── Checkout handler ──────────────────────────────────────────────────────
    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shippingInfo.shipName || !shippingInfo.shipPhone || !shippingInfo.shipAddress) {
            toast.error("Vui lòng điền đầy đủ thông tin nhận hàng!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                shipName: shippingInfo.shipName,
                shipPhone: shippingInfo.shipPhone,
                shipProvince: shippingInfo.shipProvince,
                shipAddress: shippingInfo.shipAddress,
                paymentMethod,
                voucherCode: appliedVoucherCode || null,
            };

            const response = await axiosClient.post("/order/checkout", payload);

            // BE có thể trả về { data: {...} } hoặc trực tiếp { orderId, paymentUrl, ... }
            // Xử lý cả hai trường hợp
            const raw = response.data;
            const result = raw?.data ?? raw;

            console.log("[Checkout] response:", response.data); // debug

            if (paymentMethod === "VIETQR") {
                const qrUrl = result?.paymentUrl ?? result?.PaymentUrl ?? "";
                const orderId = result?.orderId ?? result?.OrderId ?? null;

                if (!qrUrl) {
                    toast.error("Không nhận được mã QR từ server. Vui lòng thử lại.");
                    return;
                }

                setQrData({
                    isOpen: true,
                    url: qrUrl,
                    orderId,
                    amount: total,
                });
                setIsPaid(false);
                toast.success("Tạo đơn thành công! Vui lòng quét mã QR để thanh toán.");

            } else {
                const orderId = result?.orderId ?? result?.OrderId ?? null;
                
                // Xóa giỏ hàng âm thầm dưới nền (không block UI/UX của modal)
                clearCartSilently();

                // Mở Modal đặt hàng thành công với hiệu ứng xe tải giao hàng
                setQrData({
                    isOpen: true,
                    url: "", // url rỗng = COD (dùng để phân biệt hiển thị)
                    orderId,
                    amount: total,
                });
                setIsPaid(true);
                toast.success("Đặt hàng COD thành công! Đơn hàng của bạn đã được ghi nhận.");

                // Tự động chuyển hướng sau 4 giây để người dùng thấy rõ animation xe tải
                setTimeout(() => {
                    setQrData(prev => ({ ...prev, isOpen: false }));
                    setIsPaid(false);
                    navigate("/orders");
                }, 4000);
            }
        } catch (error: any) {
            const msg = error.response?.data?.message
                ?? error.response?.data?.Message
                ?? "Có lỗi xảy ra khi đặt hàng.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Clear cart helper (không throw nếu BE chưa có endpoint) ──────────────
    const clearCartSilently = async () => {
        try {
            await cartApi.clearCart();
            setCart(null);
        } catch {
            // Nếu BE chưa có /Cart/clear thì bỏ qua, không crash app
            console.warn("[Checkout] clearCart endpoint chưa có hoặc bị lỗi.");
        }
        window.dispatchEvent(new Event("cart-updated"));

        // Khôi phục lại các sản phẩm KHÔNG được chọn từ localStorage sau khi thanh toán thành công
        const backup = localStorage.getItem("cart_unchecked_backup");
        if (backup) {
            try {
                const itemsToRestore = JSON.parse(backup);
                for (const item of itemsToRestore) {
                    await cartApi.addToCart(item);
                }
            } catch (err) {
                console.error("Lỗi khi khôi phục các sản phẩm giỏ hàng chưa mua:", err);
            } finally {
                localStorage.removeItem("cart_unchecked_backup");
            }
        }
    };

    // Tự động kiểm tra trạng thái thanh toán đơn hàng VietQR (polling mỗi 3s)
    useEffect(() => {
        if (!qrData.isOpen || !qrData.orderId) return;

        let isMounted = true;
        const intervalId = setInterval(async () => {
            try {
                const response = await axiosClient.get(`/Order/${qrData.orderId}`);
                const raw = response.data;
                const detail = raw?.data ?? raw;
                const status = detail?.paymentStatus ?? detail?.PaymentStatus;
                
                if (detail && status === "Paid" && isMounted) {
                    clearInterval(intervalId);
                    await clearCartSilently();
                    setIsPaid(true);
                    toast.success("Thanh toán thành công! Đơn hàng của bạn đang được xử lý.");
                    
                    // Tự động chuyển hướng sang danh sách đơn hàng sau 3 giây để mang lại trải nghiệm mượt mà
                    setTimeout(() => {
                        if (isMounted) {
                            setQrData(prev => ({ ...prev, isOpen: false }));
                            setIsPaid(false);
                            navigate("/orders");
                        }
                    }, 3000);
                }
            } catch (err) {
                console.error("Lỗi khi kiểm tra trạng thái thanh toán tự động:", err);
            }
        }, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [qrData.isOpen, qrData.orderId, navigate]);


    // ── Tính tiền ─────────────────────────────────────────────────────────────
    const shippingFee = 30000;
    const subTotal = cart?.totalAmount ?? 0;
    const total = subTotal + shippingFee - voucherDiscount;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen font-['Outfit'] relative">

            {/* ── Header ── */}
            <header className="bg-white border-b border-gray-100 shadow-sm shrink-0 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex-shrink-0 flex items-center">
                            <a href="/" className="flex items-center gap-2">
                                <img src="/images/logo.png" alt="ALMA Logo" className="h-10 w-auto object-contain" />
                                <span className="font-bold text-xl sm:text-2xl text-gray-900 tracking-tight whitespace-nowrap hidden sm:block">
                                    ALMA Custom Threads<span className="text-blue-600">.</span>
                                </span>
                            </a>
                        </div>
                        {/* Checkout Steps */}
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                            <span onClick={() => navigate('/cart')} className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors font-medium cursor-pointer">
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">1</span> Giỏ hàng
                            </span>
                            <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 mx-1"></i>
                            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span> Thanh toán
                            </span>
                            <i className="fa-solid fa-chevron-right text-[10px] text-gray-300 mx-1"></i>
                            <span className="flex items-center gap-1.5 text-gray-400 font-medium">
                                <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-xs font-bold">3</span> Hoàn tất
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                            <i className="fa-solid fa-lock text-green-500"></i>
                            <span className="hidden sm:inline">Thanh toán an toàn</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main ── */}
            <main className={`flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col lg:flex-row gap-8 lg:gap-12 transition-all duration-300 ${qrData.isOpen ? 'blur-sm pointer-events-none' : ''}`}>

                {/* Left: Form */}
                <div className="flex-1 max-w-3xl">
                    <form onSubmit={handleCheckout}>
                        {/* Contact Info */}
                        <div className="mb-6 p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <i className="fa-solid fa-user text-blue-500"></i> Thông tin liên hệ
                                </h2>
                            </div>
                            <div>
                                <input
                                    type="email" name="email" value={shippingInfo.email}
                                    onChange={handleInputChange}
                                    placeholder="Email (dùng để gửi file in & biên lai)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm transition-all"
                                />
                                <label className="flex items-center mt-3 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 mr-2" defaultChecked /> Gửi cho tôi cập nhật về tin tức & khuyến mãi
                                </label>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="mb-6 p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <i className="fa-solid fa-location-dot text-blue-500"></i> Địa chỉ nhận hàng
                                </h2>
                                {savedAddresses.length > 0 && (
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressPicker(!showAddressPicker)}
                                            style={{
                                                background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 4px 12px -4px rgba(79, 70, 229, 0.4)',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            📋 Chọn từ địa chỉ đã lưu
                                        </button>
                                        {showAddressPicker && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                right: 0,
                                                marginTop: '8px',
                                                background: 'white',
                                                border: '1.5px solid #e2e8f0',
                                                borderRadius: '16px',
                                                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                                                zIndex: 50,
                                                width: '360px',
                                                maxHeight: '320px',
                                                overflowY: 'auto',
                                                padding: '8px',
                                            }}>
                                                {savedAddresses.map(addr => (
                                                    <div
                                                        key={addr.addressId}
                                                        onClick={() => {
                                                            const fullAddr = `${addr.addressLine}, ${addr.district}, ${addr.province}`;
                                                            setShippingInfo(prev => ({
                                                                ...prev,
                                                                shipName: addr.fullName,
                                                                shipPhone: addr.phone,
                                                                shipAddress: fullAddr,
                                                                shipProvince: addr.province,
                                                            }));
                                                            setMiniMapSearch(fullAddr);
                                                            setShowAddressPicker(false);
                                                            toast.success(`Đã chọn địa chỉ của ${addr.fullName}`);
                                                            // Geocode to update mini-map marker position
                                                            geocodeAndUpdateMiniMap(fullAddr);
                                                        }}
                                                        style={{
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.15s',
                                                            border: addr.isDefault ? '1.5px solid #3b82f6' : '1px solid transparent',
                                                            marginBottom: '4px',
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{addr.fullName}</span>
                                                            {addr.isDefault && (
                                                                <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px' }}>Mặc định</span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#64748b' }}>📞 {addr.phone}</div>
                                                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>📍 {addr.addressLine}, {addr.district}, {addr.province}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input type="text" name="shipName" required value={shippingInfo.shipName} onChange={handleInputChange} placeholder="Họ và tên" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div>
                                    <input type="tel" name="shipPhone" required value={shippingInfo.shipPhone} onChange={handleInputChange} placeholder="Số điện thoại" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div className="md:col-span-2 space-y-4">
                                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-900 shadow-sm relative">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 rounded-l-2xl"></div>
                                        <p className="font-bold flex items-center gap-2 text-blue-900 text-base">
                                            <i className="fa-solid fa-map-location-dot text-blue-500"></i>
                                            Tìm địa chỉ tự động (Bản đồ miễn phí OpenStreetMap)
                                        </p>
                                        <p className="mt-1 text-xs text-blue-700 leading-relaxed">
                                            Hệ thống định vị & tìm địa chỉ tự động. Bạn có thể gõ tìm địa chỉ hoặc di chuyển ghim trên bản đồ dưới đây để tự động điền thông tin:
                                        </p>
                                        
                                        <div className="mt-3 relative">
                                            <input
                                                type="text"
                                                value={miniMapSearch}
                                                onChange={handleMiniMapSearchChange}
                                                placeholder={leafletReady ? "Gõ tên đường, địa danh để tìm địa chỉ tự động..." : "Đang tải bản đồ..."}
                                                className="w-full border border-blue-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm bg-white text-gray-900"
                                                disabled={!leafletReady}
                                            />
                                            {miniMapLoading && (
                                                <span className="absolute right-3 top-3.5 text-blue-500">
                                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                                </span>
                                            )}
                                            
                                            {miniMapSuggestions.length > 0 && (
                                                <div className="absolute left-0 right-0 z-[500] bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-100">
                                                    {miniMapSuggestions.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleMiniMapSelect(item)}
                                                            className="px-4 py-3 hover:bg-blue-50 text-gray-700 text-xs sm:text-sm cursor-pointer transition-colors flex items-start gap-2"
                                                        >
                                                            <i className="fa-solid fa-location-dot text-blue-500 mt-1"></i>
                                                            <span>{item.display_name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Mini Map Canvas Container */}
                                    <div className="relative group rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-100">
                                        <div
                                            ref={mapContainerRef}
                                            style={{ width: '100%', height: '220px' }}
                                        />
                                        {mapReady && (
                                            <div className="absolute top-3 right-3 flex flex-col gap-2 z-[400]">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (markerRef.current) {
                                                            const pos = markerRef.current.getLatLng();
                                                            setModalCoords({ lat: pos.lat, lng: pos.lng });
                                                        }
                                                        setIsMapModalOpen(true);
                                                    }}
                                                    className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-800 text-[11px] font-bold rounded-xl shadow-md border border-gray-100 flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95"
                                                >
                                                    <i className="fa-solid fa-expand text-blue-500"></i> Xem Bản Đồ Lớn
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleGPSLocation(false)}
                                                    className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-500/20"
                                                    title="Định vị GPS hiện tại"
                                                >
                                                    <i className="fa-solid fa-location-crosshairs text-sm"></i>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Địa chỉ đã chọn (hiện ra sau khi chọn từ Maps hoặc nhập thủ công) */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Địa chỉ nhận hàng</label>
                                    <input type="text" name="shipAddress" required value={shippingInfo.shipAddress} onChange={handleInputChange} placeholder="Số nhà, đường, phường/xã..." className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tỉnh / Thành phố</label>
                                    <input type="text" name="shipProvince" required value={shippingInfo.shipProvince} onChange={handleInputChange} placeholder="Tỉnh / Thành phố (tự động điền khi chọn từ bản đồ)" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Shipping Method */}
                        <div className="mb-6 p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-truck text-blue-500"></i> Phương thức vận chuyển
                            </h2>
                            <div className="border-2 border-blue-500 bg-blue-50/50 rounded-xl p-4 flex justify-between items-center">
                                <label className="flex items-center cursor-pointer w-full">
                                    <input type="radio" name="shipping" defaultChecked className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-3" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">Giao hàng tiêu chuẩn (GHTK / GHN)</span>
                                        <span className="text-xs text-gray-500">Dự kiến giao hàng: 2-3 ngày</span>
                                    </div>
                                </label>
                                <span className="font-bold text-gray-900 text-sm whitespace-nowrap">{shippingFee.toLocaleString()}đ</span>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="mb-6 p-6 bg-white border border-gray-100 shadow-md rounded-2xl">
                            <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <i className="fa-solid fa-credit-card text-blue-500"></i> Phương thức thanh toán
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">Tất cả giao dịch đều được mã hóa và bảo mật an toàn.</p>

                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                {/* VietQR */}
                                <div className={`p-4 transition-colors ${paymentMethod === 'VIETQR' ? 'bg-blue-50/50' : 'bg-white'}`}>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="payment" value="VIETQR" checked={paymentMethod === 'VIETQR'} onChange={() => setPaymentMethod('VIETQR')} className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-3" />
                                        <span className="font-medium text-gray-900 flex-1 text-sm">Chuyển khoản VietQR</span>
                                        <i className="fa-solid fa-qrcode text-blue-500 text-xl ml-auto"></i>
                                    </label>
                                    {paymentMethod === 'VIETQR' && (
                                        <p className="pl-8 pt-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                                            <i className="fa-solid fa-circle-info mr-1 text-blue-400"></i>
                                            Mã QR sẽ hiện ra ngay sau khi bạn xác nhận đặt hàng.
                                        </p>
                                    )}
                                </div>
                                {/* COD */}
                                <div className={`p-4 transition-colors ${paymentMethod === 'COD' ? 'bg-blue-50/50' : 'bg-white'}`}>
                                    <label className="flex items-center cursor-pointer">
                                        <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-3" />
                                        <span className="font-medium text-gray-900 text-sm">Thanh toán khi nhận hàng (COD)</span>
                                    </label>
                                    {paymentMethod === 'COD' && (
                                        <div className="pl-8 pt-2">
                                            <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                <i className="fa-solid fa-circle-info mr-1 text-blue-400"></i>
                                                Bạn sẽ thanh toán bằng tiền mặt cho shipper khi nhận được áo.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex justify-between items-center mb-10 mt-8">
                            <span onClick={() => navigate('/cart')} className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-xl transition-colors text-sm cursor-pointer">
                                <i className="fa-solid fa-arrow-left-long"></i> Quay lại giỏ hàng
                            </span>
                            <button
                                type="submit"
                                disabled={loading || cartLoading || !cart || cart.items.length === 0}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 text-base flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check-circle"></i>}
                                {loading ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Right: Order Summary */}
                <aside className="w-full lg:w-[420px] shrink-0">
                    <div className="bg-white rounded-2xl overflow-hidden lg:sticky lg:top-8 border border-gray-100 shadow-lg">
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                                <i className="fa-solid fa-bag-shopping"></i> Đơn hàng của bạn
                            </h3>
                        </div>
                        <div className="p-6">
                            {/* Cart items */}
                            {cartLoading ? (
                                <div className="space-y-3 animate-pulse mb-6">
                                    <div className="h-14 bg-gray-100 rounded-xl" />
                                    <div className="h-14 bg-gray-100 rounded-xl" />
                                </div>
                            ) : !cart || cart.items.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm mb-4">
                                    <i className="fa-solid fa-cart-xmark text-2xl mb-2 block" />
                                    Giỏ hàng trống
                                </div>
                            ) : (
                                <div className="space-y-4 mb-6">
                                    {cart.items.map(item => (
                                        <div key={item.cartItemId} className="flex gap-4 items-center">
                                            <div className="relative">
                                                <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <img src={resolveApiAssetUrl(item.imageUrl) || '/images/default-shirt.png'} alt={item.productName} className="w-full h-full object-contain" />
                                                    ) : (
                                                        <i className="fa-solid fa-shirt text-gray-300 text-2xl" />
                                                    )}
                                                </div>
                                                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{item.productName}</h4>
                                            {item.requiresSize && (
                                                <p className="text-xs text-gray-500">Size: {item.size}</p>
                                            )}
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Coupon / Voucher Section */}
                            <div className="border-t border-gray-100 pt-4 mt-4 pb-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mã giảm giá / Voucher</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nhập mã voucher..."
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-gray-400"
                                        disabled={!!appliedVoucherCode}
                                    />
                                    {appliedVoucherCode ? (
                                        <button
                                            type="button"
                                            onClick={handleRemoveVoucher}
                                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                                        >
                                            Hủy bỏ
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleApplyVoucher}
                                            disabled={isValidatingVoucher || !voucherCode.trim()}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                        >
                                            {isValidatingVoucher && <i className="fa-solid fa-spinner fa-spin"></i>}
                                            Áp dụng
                                        </button>
                                    )}
                                </div>
                                {voucherMessage && (
                                    <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${appliedVoucherCode ? 'text-green-600' : 'text-red-500'}`}>
                                        <i className={`fa-solid ${appliedVoucherCode ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                                        {voucherMessage}
                                    </p>
                                )}
                            </div>

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-5 space-y-3 mb-5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tạm tính</span>
                                    <span className="font-medium text-gray-900">{subTotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span className="font-medium text-gray-900">
                                        {isFreeShipping ? (
                                            <span className="line-through text-gray-400 mr-1.5">{shippingFee.toLocaleString('vi-VN')}đ</span>
                                        ) : null}
                                        {isFreeShipping ? "Miễn phí" : `${shippingFee.toLocaleString('vi-VN')}đ`}
                                    </span>
                                </div>
                                {voucherDiscount > 0 && !isFreeShipping && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Giảm giá (Voucher)</span>
                                        <span>-{voucherDiscount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                                {isFreeShipping && (
                                    <div className="flex justify-between text-sm text-green-600 font-medium">
                                        <span>Khuyến mãi vận chuyển</span>
                                        <span>-{shippingFee.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 pt-5 flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 text-xs mt-1">VND</span>
                                    <span className="text-2xl font-black text-gray-900">{total.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* ── VietQR Modal ── */}
            {qrData.isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-5 sm:p-7 max-w-sm w-full text-center relative border border-gray-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
                        {isPaid ? (
                            // SUCCESS SCREEN (Shopee-style shipping truck animation) — hiện cho cả COD và VietQR
                            <div>
                                <div className="mb-3">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border-2 shadow-inner ${
                                        qrData.url ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'
                                    }`}>
                                        {qrData.url ? (
                                            <i className="fa-solid fa-circle-check text-4xl text-blue-500"></i>
                                        ) : (
                                            <i className="fa-solid fa-truck-fast text-4xl text-orange-500"></i>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900">
                                        {qrData.url ? "Thanh toán thành công!" : "Đặt hàng thành công! 🎉"}
                                    </h3>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {qrData.url
                                            ? "Đơn hàng của bạn đã được xác nhận và đang chuẩn bị"
                                            : "Đơn COD của bạn đã được ghi nhận — chúng tôi sẽ liên hệ sớm!"}
                                    </p>
                                </div>

                                {/* Shopee-style moving truck animation — hiện cho cả COD lẫn VietQR */}
                                <div className={`relative w-full h-16 rounded-xl overflow-hidden flex items-center mb-4 border ${
                                    qrData.url
                                        ? 'bg-blue-50/60 border-blue-100'
                                        : 'bg-orange-50/60 border-orange-100'
                                }`}>
                                    <style dangerouslySetInnerHTML={{__html: `
                                        @keyframes roadMoving {
                                            0% { background-position-x: 0px; }
                                            100% { background-position-x: -40px; }
                                        }
                                        @keyframes truckBounce {
                                            0%, 100% { transform: translateY(0); }
                                            50% { transform: translateY(-4px); }
                                        }
                                        @keyframes truckMove {
                                            0% { left: -25%; }
                                            100% { left: 115%; }
                                        }
                                        .animate-road {
                                            background-image: linear-gradient(90deg, #cbd5e1 50%, transparent 50%);
                                            background-size: 20px 2px;
                                            animation: roadMoving 0.8s linear infinite;
                                        }
                                        .animate-truck-bounce {
                                            animation: truckBounce 0.5s ease-in-out infinite;
                                        }
                                        .animate-truck-slide {
                                            position: absolute;
                                            bottom: 8px;
                                            animation: truckMove 3.5s linear infinite;
                                        }
                                    `}} />
                                    {/* Road — dashed moving line */}
                                    <div className="absolute bottom-3 left-0 right-0 h-0.5 animate-road bg-repeat-x"></div>
                                    {/* Moving Truck icon */}
                                    <div className="animate-truck-slide animate-truck-bounce">
                                        <i className={`fa-solid fa-truck-fast text-2xl drop-shadow-sm ${
                                            qrData.url ? 'text-blue-500' : 'text-orange-500'
                                        }`}></i>
                                    </div>
                                    {/* Status badge */}
                                    <span className={`absolute top-2 left-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        qrData.url
                                            ? 'text-blue-600 bg-blue-100/80'
                                            : 'text-orange-600 bg-orange-100/80'
                                    }`}>
                                        {qrData.url ? 'Đang chuẩn bị hàng...' : 'Đang chuẩn bị giao hàng COD...'}
                                    </span>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3.5 mb-4 border border-gray-100 text-left space-y-1.5">
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Mã đơn hàng:</span>
                                        <span className="font-bold text-gray-800">#{qrData.orderId}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Phương thức:</span>
                                        <span className="font-semibold text-gray-800">
                                            {qrData.url ? "Chuyển khoản VietQR" : "Thanh toán khi nhận hàng (COD)"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Trạng thái đơn hàng:</span>
                                        <span className="font-bold text-blue-600">
                                            {qrData.url ? "Đang chuẩn bị hàng" : "Chờ xác nhận & chuẩn bị giao"}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setQrData({ ...qrData, isOpen: false });
                                        setIsPaid(false);
                                        navigate("/orders");
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 text-xs sm:text-sm"
                                >
                                    <i className="fa-solid fa-arrow-left-long"></i> Quay lại danh sách đơn hàng
                                </button>
                            </div>
                        ) : (
                            // REGULAR QR CODE SCREEN (Removed 'Tôi đã thanh toán xong' button)
                            <div>
                                <div className="mb-3">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <i className="fa-solid fa-qrcode text-2xl text-blue-600"></i>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-gray-900">Quét mã thanh toán</h3>
                                    <p className="text-gray-500 text-xs mt-0.5">Mở ứng dụng ngân hàng để quét mã</p>
                                </div>

                                {/* QR Image */}
                                <div className="bg-white p-2 rounded-2xl inline-block mb-4 border border-gray-100 shadow-sm">
                                    <img
                                        src={qrData.url}
                                        alt="VietQR Payment"
                                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                                        onError={(e) => {
                                            // Fallback nếu ảnh lỗi
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3.5 mb-4">
                                    <p className="text-xs text-gray-600 mb-0.5">Số tiền cần thanh toán</p>
                                    <p className="text-xl font-black text-blue-600">{qrData.amount.toLocaleString('vi-VN')} VNĐ</p>
                                    <p className="text-[10px] text-red-500 italic mt-1.5">* Hệ thống tự động chuyển trang khi nhận được tiền</p>
                                </div>

                                {qrData.orderId && (
                                    <p className="text-xs text-gray-400 mb-3">Mã đơn: #{qrData.orderId}</p>
                                )}

                                <button
                                    disabled={changingPaymentMethod}
                                    onClick={async () => {
                                        if (!qrData.orderId) return;
                                        setChangingPaymentMethod(true);
                                        try {
                                            await axiosClient.patch(`/order/${qrData.orderId}/change-payment-method`, {
                                                paymentMethod: "COD"
                                            });
                                            await clearCartSilently();
                                            toast.success("Đã chuyển sang COD thành công! Vui lòng đợi bên shop xác nhận và gói hàng.");
                                            // Hiện màn xe tải giao hàng thay vì navigate ngay
                                            setQrData(prev => ({ ...prev, url: "" }));
                                            setIsPaid(true);
                                            // Tự động chuyển trang sau 4 giây
                                            setTimeout(() => {
                                                setQrData(prev => ({ ...prev, isOpen: false }));
                                                setIsPaid(false);
                                                navigate("/orders");
                                            }, 4000);
                                        } catch (error) {
                                            toast.error("Không thể tự động chuyển sang COD. Vui lòng liên hệ hỗ trợ.");
                                            await clearCartSilently();
                                            // Vẫn hiện màn xe tải kể cả khi lỗi (đơn đã tạo)
                                            setQrData(prev => ({ ...prev, url: "" }));
                                            setIsPaid(true);
                                            setTimeout(() => {
                                                setQrData(prev => ({ ...prev, isOpen: false }));
                                                setIsPaid(false);
                                                navigate("/orders");
                                            }, 4000);
                                        } finally {
                                            setChangingPaymentMethod(false);
                                        }
                                    }}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm"
                                >
                                    {changingPaymentMethod ? (
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                    ) : (
                                        <i className="fa-solid fa-truck-fast"></i>
                                    )}
                                    {changingPaymentMethod ? "Đang cập nhật..." : "Tôi muốn đổi sang giao COD"}
                                </button>

                                <button
                                    disabled={changingPaymentMethod}
                                    onClick={async () => {
                                        await clearCartSilently();
                                        setQrData({ ...qrData, isOpen: false });
                                        toast.success("Đơn hàng đã được lưu! Bạn có thể thanh toán sau.");
                                        navigate("/orders");
                                    }}
                                    className="mt-2 w-full text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors py-1.5 block text-center disabled:opacity-60"
                                >
                                    Thanh toán sau
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Google Maps Selector Modal ── */}
            {isMapModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full flex flex-col max-h-[95vh] overflow-hidden border border-gray-100 relative">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <i className="fa-solid fa-map-location-dot text-blue-500" />
                                Chọn vị trí giao hàng trên Bản Đồ
                            </h3>
                            <button 
                                type="button" 
                                onClick={() => setIsMapModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <i className="fa-solid fa-xmark text-lg"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    <i className="fa-solid fa-magnifying-glass text-blue-400 mr-1" />
                                    Tìm kiếm địa chỉ nhanh
                                </label>
                                <input
                                    type="text"
                                    value={modalSearch}
                                    onChange={handleModalSearchChange}
                                    placeholder={modalMapReady ? 'Gõ tên đường, địa danh để tìm kiếm...' : 'Đang tải bản đồ...'}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-900"
                                    disabled={!modalMapReady}
                                />
                                {modalLoading && (
                                    <span className="absolute right-3 top-9 text-blue-500">
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                    </span>
                                )}
                                
                                {modalSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 z-[1000] bg-white border border-gray-200 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto divide-y divide-gray-100">
                                        {modalSuggestions.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleModalSelect(item)}
                                                className="px-4 py-3 hover:bg-blue-50 text-gray-700 text-xs sm:text-sm cursor-pointer transition-colors flex items-start gap-2"
                                            >
                                                <i className="fa-solid fa-location-dot text-blue-500 mt-1"></i>
                                                <span>{item.display_name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Map Canvas */}
                            <div className="relative">
                                <div
                                    ref={modalMapContainerRef}
                                    style={{ width: '100%', height: '320px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f1f5f9' }}
                                />
                                {modalMapReady && (
                                    <button
                                        type="button"
                                        onClick={() => handleGPSLocation(true)}
                                        className="absolute bottom-4 right-4 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-[400] border border-blue-500/20"
                                        title="Sử dụng GPS hiện tại"
                                    >
                                        <i className="fa-solid fa-location-crosshairs text-lg"></i>
                                    </button>
                                )}
                            </div>

                            {/* Address Preview Info */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">📍 Địa chỉ định vị</p>
                                <p className="text-sm font-semibold text-gray-800 leading-snug">
                                    {modalAddress || "Vui lòng chọn một điểm hoặc nhập địa chỉ để định vị."}
                                </p>
                                {modalProvince && (
                                    <p className="text-xs text-gray-500 font-medium">Tỉnh/Thành phố: {modalProvince}</p>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button
                                type="button"
                                onClick={() => setIsMapModalOpen(false)}
                                className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 font-bold rounded-xl text-sm transition-all shadow-sm"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmModalLocation}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center gap-1.5"
                            >
                                <i className="fa-solid fa-circle-check"></i>
                                Xác nhận vị trí
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;
