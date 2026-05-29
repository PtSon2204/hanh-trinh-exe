import React, { useState, useEffect, useRef, useCallback } from 'react';

// Declare Leaflet types
declare global {
    interface Window {
        L: any;
    }
}
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import authApi from '../api/authApi';
import axiosClient, { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import type { AddressDto } from '../../../shared/types/auth.types';
import '../styles/auth.css';
import '../../home/pages/HomePage.css';

// ── Icons ────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.43a16 16 0 0 0 5.66 5.66l1.79-1.79a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

type Tab = 'profile' | 'password' | 'addresses';

export default function ProfilePage() {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // ── Profile form state ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ fullName: user?.fullName ?? '', phone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Change password state ───────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Avatar state ────────────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // ── Address Book state ──────────────────────────────────────────
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [addressModal, setAddressModal] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    addressId?: number;
    fullName: string;
    phone: string;
    addressLine: string;
    province: string;
    district: string;
    isDefault: boolean;
  }>({
    isOpen: false,
    mode: 'add',
    fullName: '',
    phone: '',
    addressLine: '',
    province: '',
    district: '',
    isDefault: false
  });

  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [addressSearchLoading, setAddressSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<any>(null);

  // ── Leaflet Map state for address modal ──────────────────────────
  const [leafletReady, setLeafletReady] = useState(false);
  const [addrMapReady, setAddrMapReady] = useState(false);
  const [addrMapCoords, setAddrMapCoords] = useState<{ lat: number; lng: number }>({ lat: 21.0285, lng: 105.8542 });
  const addrMapContainerRef = useRef<HTMLDivElement>(null);
  const addrMapRef = useRef<any>(null);
  const addrMarkerRef = useRef<any>(null);
  const addrMapSearchTimeoutRef = useRef<any>(null);
  const [addrMapSearch, setAddrMapSearch] = useState('');
  const [addrMapSuggestions, setAddrMapSuggestions] = useState<any[]>([]);
  const [addrMapSearchLoading, setAddrMapSearchLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // ── Load profile data on mount ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get('/profile');
        const data = response.data;
        setProfileForm({
          fullName: data.fullName ?? user.fullName,
          phone: data.phone ?? '',
        });
        setAvatarUrl(data.avatarUrl ?? '');
        
        // Sync profile data to AuthContext if updated
        if (data.avatarUrl !== user.avatarUrl || data.fullName !== user.fullName) {
          login({
            ...user,
            fullName: data.fullName ?? user.fullName,
            avatarUrl: data.avatarUrl ?? null,
          });
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, [user, login]);

  // ── Load Leaflet dynamically ────────────────────────────────────
  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existingScript = document.getElementById('leaflet-js');
    if (existingScript) {
      if (window.L) {
        setLeafletReady(true);
      } else {
        const handleLoad = () => setLeafletReady(true);
        existingScript.addEventListener('load', handleLoad);
        return () => { existingScript.removeEventListener('load', handleLoad); };
      }
    } else {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletReady(true);
      script.onerror = () => console.error('Failed to load Leaflet script.');
      document.head.appendChild(script);
    }
  }, []);

  // ── Geocoding helpers ──────────────────────────────────────────
  const searchGeocodeSuggestions = useCallback(async (query: string): Promise<any[]> => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1&email=son.bafpt@gmail.com`, {
        headers: { 'Accept-Language': 'vi' }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    } catch (err) {
      console.warn('Nominatim search failed, trying Photon fallback:', err);
    }
    try {
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const geojson = await response.json();
        if (geojson && Array.isArray(geojson.features)) {
          return geojson.features.map((feat: any) => {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates || [0, 0];
            const parts = [props.name, props.street, props.locality, props.district, props.city || props.town, props.state, props.country].filter(Boolean);
            return {
              display_name: parts.join(', '),
              lat: coords[1].toString(),
              lon: coords[0].toString(),
              address: { city: props.city || props.town || '', town: props.town || '', state: props.state || '' }
            };
          });
        }
      }
    } catch (err) {
      console.error('Geocoding search fallback failed:', err);
    }
    return [];
  }, []);

  const reverseGeocodeAddr = useCallback(async (lat: number, lng: number, updateCallback: (address: string, province: string, district: string) => void) => {
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
          let province = '';
          let district = '';
          if (data.address) {
            province = data.address.city || data.address.town || data.address.municipality || data.address.state || '';
            district = data.address.suburb || data.address.district || data.address.county || '';
          }
          updateCallback(fullAddress, province || 'Việt Nam', district || 'Khác');
          return;
        }
      }
    } catch (err: any) {
      console.warn('Nominatim reverse geocoding failed:', err?.name === 'AbortError' ? 'Timeout' : err);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const geojson = await response.json();
        if (geojson && Array.isArray(geojson.features) && geojson.features.length > 0) {
          const props = geojson.features[0].properties || {};
          const parts = [props.name, props.housenumber, props.street, props.locality, props.district, props.city || props.town, props.state, props.country].filter(Boolean);
          const fullAddress = parts.join(', ');
          const province = props.city || props.town || props.state || '';
          const district = props.district || props.locality || '';
          updateCallback(fullAddress, province || 'Việt Nam', district || 'Khác');
          return;
        }
      }
    } catch (err: any) {
      console.error('Photon reverse geocoding also failed:', err?.name === 'AbortError' ? 'Timeout' : err);
    }
  }, []);

  // ── Init Leaflet map in address modal ──────────────────────────
  const initAddrMap = useCallback(() => {
    if (!window.L || !addrMapContainerRef.current) return;
    try {
      if (addrMapRef.current) {
        addrMapRef.current.remove();
        addrMapRef.current = null;
      }
      const map = window.L.map(addrMapContainerRef.current, {
        center: [addrMapCoords.lat, addrMapCoords.lng],
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });
      addrMapRef.current = map;
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const redIcon = window.L.divIcon({
        html: `<div style="display:flex;justify-content:center;align-items:center;width:40px;height:40px;"><svg viewBox="0 0 24 24" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" fill="#EF4444"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg></div>`,
        className: 'custom-pin',
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const marker = window.L.marker([addrMapCoords.lat, addrMapCoords.lng], { draggable: true, icon: redIcon }).addTo(map);
      addrMarkerRef.current = marker;

      const onDragEnd = async () => {
        const position = marker.getLatLng();
        setAddrMapCoords({ lat: position.lat, lng: position.lng });
        await reverseGeocodeAddr(position.lat, position.lng, (address, province, district) => {
          setAddressModal(prev => ({ ...prev, addressLine: address, province, district }));
          setAddressSearch(address);
          setAddrMapSearch(address);
        });
      };
      marker.on('dragend', onDragEnd);

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setAddrMapCoords({ lat, lng });
        await reverseGeocodeAddr(lat, lng, (address, province, district) => {
          setAddressModal(prev => ({ ...prev, addressLine: address, province, district }));
          setAddressSearch(address);
          setAddrMapSearch(address);
        });
      });

      setAddrMapReady(true);
    } catch (err) {
      console.error('Error initializing address modal Leaflet map:', err);
    }
  }, [addrMapCoords, reverseGeocodeAddr]);

  // Init map when modal opens
  useEffect(() => {
    if (addressModal.isOpen && leafletReady && !addrMapReady) {
      const timer = setTimeout(() => initAddrMap(), 200);
      return () => clearTimeout(timer);
    }
  }, [addressModal.isOpen, leafletReady, addrMapReady, initAddrMap]);

  // Reset map ready when modal closes
  useEffect(() => {
    if (!addressModal.isOpen) {
      setAddrMapReady(false);
      if (addrMapRef.current) {
        addrMapRef.current.remove();
        addrMapRef.current = null;
      }
    }
  }, [addressModal.isOpen]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (addrMapSearchTimeoutRef.current) clearTimeout(addrMapSearchTimeoutRef.current);
    };
  }, []);

  // ── Map search handlers ────────────────────────────────────────
  const handleAddrMapSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAddrMapSearch(val);
    if (val.trim().length < 3) { setAddrMapSuggestions([]); return; }
    if (addrMapSearchTimeoutRef.current) clearTimeout(addrMapSearchTimeoutRef.current);
    setAddrMapSearchLoading(true);
    addrMapSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchGeocodeSuggestions(val);
        setAddrMapSuggestions(results);
      } catch (err) {
        console.error('Map search error:', err);
      } finally {
        setAddrMapSearchLoading(false);
      }
    }, 600);
  };

  const handleAddrMapSelect = (item: any) => {
    const fullAddress = item.display_name;
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    let province = '';
    let district = '';
    if (item.address) {
      province = item.address.city || item.address.town || item.address.municipality || item.address.state || '';
      district = item.address.suburb || item.address.district || item.address.county || '';
    }
    if (!province) {
      const parts = fullAddress.split(',');
      province = parts[parts.length - 2]?.trim() || '';
      district = parts[parts.length - 3]?.trim() || '';
    }
    setAddressModal(prev => ({ ...prev, addressLine: fullAddress, province: province || 'Việt Nam', district: district || 'Khác' }));
    setAddressSearch(fullAddress);
    setAddrMapSearch(fullAddress);
    setAddrMapSuggestions([]);
    setAddrMapCoords({ lat, lng });
    if (addrMapRef.current && addrMarkerRef.current) {
      addrMapRef.current.setView([lat, lng], 16);
      addrMarkerRef.current.setLatLng([lat, lng]);
    }
  };

  // ── GPS location handler ───────────────────────────────────────
  const handleGpsLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ GPS.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setAddrMapCoords({ lat, lng });
        if (addrMapRef.current && addrMarkerRef.current) {
          addrMapRef.current.setView([lat, lng], 16);
          addrMarkerRef.current.setLatLng([lat, lng]);
        }
        await reverseGeocodeAddr(lat, lng, (address, province, district) => {
          setAddressModal(prev => ({ ...prev, addressLine: address, province, district }));
          setAddressSearch(address);
          setAddrMapSearch(address);
        });
        setGpsLoading(false);
        toast.success('Đã xác định vị trí của bạn!');
      },
      (err) => {
        setGpsLoading(false);
        console.error('GPS error:', err);
        toast.error('Không thể xác định vị trí. Vui lòng cho phép truy cập GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Load addresses when active tab is addresses ──────────────────
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await axiosClient.get<AddressDto[]>('/profile/addresses');
      setAddresses(res.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'addresses' && user) {
      fetchAddresses();
    }
  }, [activeTab, user]);

  const handleAddressSearchChange = (val: string) => {
    setAddressSearch(val);
    if (val.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setAddressSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=vn&limit=5&addressdetails=1&email=son.bafpt@gmail.com`, {
          headers: { 'Accept-Language': 'vi' }
        });
        if (response.ok) {
          const data = await response.json();
          setAddressSuggestions(data || []);
        }
      } catch (err) {
        console.warn("Nominatim geocoding failed, trying Photon fallback:", err);
        try {
          const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5`);
          if (response.ok) {
            const geojson = await response.json();
            if (geojson && Array.isArray(geojson.features)) {
              const mapped = geojson.features.map((feat: any) => {
                const props = feat.properties || {};
                const parts = [props.name, props.street, props.locality, props.district, props.city || props.town, props.state, props.country].filter(Boolean);
                return {
                  display_name: parts.join(', '),
                  address: {
                    city: props.city || props.town || props.state || '',
                    suburb: props.district || props.locality || '',
                  }
                };
              });
              setAddressSuggestions(mapped);
            }
          }
        } catch (error) {
          console.error("Geocoding search failed:", error);
        }
      } finally {
        setAddressSearchLoading(false);
      }
    }, 600);
  };

  const handleAddressSelect = (item: any) => {
    let province = item.address?.city || item.address?.town || item.address?.state || '';
    let district = item.address?.suburb || item.address?.district || item.address?.county || '';
    
    // Fallback if not parsed well
    if (!province) {
      const parts = item.display_name.split(',');
      province = parts[parts.length - 2]?.trim() || '';
      district = parts[parts.length - 3]?.trim() || '';
    }

    setAddressModal(prev => ({
      ...prev,
      addressLine: item.display_name,
      province: province || 'Việt Nam',
      district: district || 'Khác'
    }));
    setAddressSearch(item.display_name);
    setAddressSuggestions([]);
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressModal.fullName || !addressModal.phone || !addressModal.addressLine || !addressModal.province || !addressModal.district) {
      toast.error('Vui lòng nhập đầy đủ các trường thông tin!');
      return;
    }
    const payload = {
      fullName: addressModal.fullName,
      phone: addressModal.phone,
      addressLine: addressModal.addressLine,
      province: addressModal.province,
      district: addressModal.district,
      isDefault: addressModal.isDefault
    };
    try {
      if (addressModal.mode === 'add') {
        await axiosClient.post('/profile/addresses', payload);
        toast.success('Thêm địa chỉ giao hàng thành công!');
      } else {
        await axiosClient.put(`/profile/addresses/${addressModal.addressId}`, payload);
        toast.success('Cập nhật địa chỉ giao hàng thành công!');
      }
      setAddressModal(prev => ({ ...prev, isOpen: false }));
      setAddressSearch('');
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu địa chỉ giao hàng.');
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await axiosClient.put(`/profile/addresses/${id}/default`);
      toast.success('Đã đặt làm địa chỉ mặc định!');
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error('Không thể đặt địa chỉ mặc định.');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    try {
      await axiosClient.delete(`/profile/addresses/${id}`);
      toast.success('Xóa địa chỉ giao hàng thành công!');
      fetchAddresses();
    } catch (err) {
      console.error(err);
      toast.error('Không thể xóa địa chỉ.');
    }
  };

  // ── Redirect if not authenticated ───────────────────────────────
  if (!user) {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', gap:'1rem', fontFamily:'Outfit,sans-serif' }}>
        <p style={{ fontSize:'1.125rem', color:'#64748b' }}>Bạn cần đăng nhập để xem trang này.</p>
        <Link to="/login" style={{ color:'#4f46e5', fontWeight:700, textDecoration:'none' }}>Đăng nhập ngay</Link>
      </div>
    );
  }

  // ── Handlers ────────────────────────────────────────────────────
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null); setProfileLoading(true);
    try {
      await axiosClientPut('/profile', { fullName: profileForm.fullName, phone: profileForm.phone || undefined });
      
      // Update session in context and localStorage
      login({
        ...user,
        fullName: profileForm.fullName,
      });

      setProfileMsg({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      toast.success('Đã lưu thông tin!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Cập nhật thất bại.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh tối đa là 5MB!');
      return;
    }

    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosClient.post('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.avatarUrl) {
        setAvatarUrl(response.data.avatarUrl);
        // Sync to AuthContext immediately
        login({
          ...user,
          avatarUrl: response.data.avatarUrl,
        });
        toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
      } else {
        toast.error('Không tìm thấy đường dẫn ảnh phản hồi.', { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải ảnh lên!', { id: toastId });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ type:'error', text:'Mật khẩu mới không khớp.' }); return; }
    if (pwForm.next.length < 6) { setPwMsg({ type:'error', text:'Mật khẩu mới phải ít nhất 6 ký tự.' }); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
        confirmNewPassword: pwForm.confirm,
      });
      setPwMsg({ type:'success', text:'Đổi mật khẩu thành công!' });
      setPwForm({ current:'', next:'', confirm:'' });
      toast.success('Mật khẩu đã được cập nhật!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Đổi mật khẩu thất bại.';
      setPwMsg({ type:'error', text: msg });
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    toast.success('Đã đăng xuất!');
    navigate('/login');
  };

  // Avatar initials
  const initials = user.fullName.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Outfit,sans-serif' }}>
      {/* Top nav bar */}
      <nav className="alma-nav" style={{
        padding:'0 1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', height:'64px',
        position:'sticky', top:0, zIndex:100,
        boxShadow:'0 1px 3px rgba(0,0,0,.06)',
      }}>
        <Link to="/" className="alma-nav__brand">
          <img
            src="/images/logo.png"
            alt="ALMA Logo"
            className="alma-nav__logo"
          />
          <span className="alma-nav__title">
            ALMA Custom Threads<span className="dot">.</span>
          </span>
        </Link>

        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <span style={{ fontSize:'.875rem', color:'#64748b' }}>Xin chào, <strong style={{ color:'#1e293b' }}>{user.fullName}</strong></span>
          <button
            id="profile-logout"
            onClick={handleLogout}
            style={{
              display:'flex', alignItems:'center', gap:'.375rem',
              padding:'.5rem 1rem', borderRadius:'.625rem',
              border:'1.5px solid #e2e8f0', background:'white',
              cursor:'pointer', fontFamily:'Outfit,sans-serif', fontSize:'.8125rem', fontWeight:600, color:'#64748b',
              transition:'all .2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#ef4444'; (e.currentTarget as HTMLButtonElement).style.color='#ef4444'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor='#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.color='#64748b'; }}
          >
            <LogoutIcon /> Đăng xuất
          </button>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth:'720px', margin:'0 auto', padding:'2rem 1.5rem' }}>
        {/* Header */}
        <div style={{
          background:'linear-gradient(135deg,#0f172a,#1e293b,#312e81)',
          borderRadius:'1.5rem', padding:'2rem', marginBottom:'1.5rem',
          display:'flex', alignItems:'center', gap:'1.5rem', position:'relative', overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:'-40px', right:'-40px',
            width:'200px', height:'200px', background:'rgba(99,102,241,.2)',
            borderRadius:'50%', filter:'blur(40px)',
          }} />
          
          {/* Avatar Area with Image Upload */}
          <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={resolveApiAssetUrl(avatarUrl) || ''}
                alt="Avatar"
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(255,255,255,.2)',
                  display: 'block',
                }}
              />
            ) : (
              <div style={{
                width:'72px', height:'72px', borderRadius:'50%',
                background:'linear-gradient(135deg,#3b82f6,#6366f1)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.5rem', fontWeight:800, color:'white',
                border:'3px solid rgba(255,255,255,.2)',
              }}>{initials}</div>
            )}
            
            {/* Edit overlay icon */}
            <label
              htmlFor="avatar-upload-file"
              style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#3b82f6',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                zIndex: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </label>
            <input
              id="avatar-upload-file"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>

          <div style={{ zIndex: 1 }}>
            <h1 style={{ fontSize:'1.375rem', fontWeight:800, color:'white', marginBottom:'.25rem' }}>{user.fullName}</h1>
            <p style={{ fontSize:'.875rem', color:'#94a3b8' }}>{user.email}</p>
            <span style={{
              display:'inline-block', marginTop:'.5rem',
              padding:'.2rem .625rem', borderRadius:'999px',
              background:'rgba(99,102,241,.3)', color:'#a5b4fc',
              fontSize:'.6875rem', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase',
            }}>{user.role}</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display:'flex', borderRadius:'1rem', background:'white',
          border:'1px solid #e2e8f0', marginBottom:'1.5rem', padding:'.25rem',
        }}>
          {(['profile', 'password', 'addresses'] as Tab[]).map(tab => (
            <button
              key={tab}
              id={`profile-tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              style={{
                flex:1, padding:'.625rem 1rem', borderRadius:'.75rem', border:'none', cursor:'pointer',
                fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'.875rem', transition:'all .2s',
                background: activeTab === tab ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
                color: activeTab === tab ? 'white' : '#64748b',
                boxShadow: activeTab === tab ? '0 4px 12px -4px rgba(79,70,229,.4)' : 'none',
              }}
            >
              {tab === 'profile' ? '👤 Thông tin cá nhân' : tab === 'password' ? '🔒 Đổi mật khẩu' : '📦 Sổ địa chỉ nhận hàng'}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', marginBottom:'1.5rem' }}>Cập nhật thông tin</h2>

            {profileMsg && <div className={`alert alert--${profileMsg.type}`}>{profileMsg.text}</div>}

            <form onSubmit={handleProfileSave} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <span className="form-icon"><UserIcon /></span>
                <input
                  id="profile-fullname"
                  className="form-input"
                  type="text"
                  placeholder="Họ và tên"
                  value={profileForm.fullName}
                  onChange={e => setProfileForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <span className="form-icon"><PhoneIcon /></span>
                <input
                  id="profile-phone"
                  className="form-input"
                  type="tel"
                  placeholder="Số điện thoại"
                  value={profileForm.phone}
                  onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                />
              </div>

              <button id="profile-save" type="submit" className="btn-primary" disabled={profileLoading} style={{ maxWidth:'200px' }}>
                {profileLoading ? <span className="spinner" /> : <><SaveIcon /><span>Lưu thay đổi</span></>}
              </button>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0' }}>
            <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', marginBottom:'1.5rem' }}>Đổi mật khẩu</h2>

            {pwMsg && <div className={`alert alert--${pwMsg.type}`}>{pwMsg.text}</div>}

            <form onSubmit={handlePasswordChange} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {[
                { id:'pw-current', field:'current' as const, label:'Mật khẩu hiện tại', showKey:'current' as const },
                { id:'pw-new', field:'next' as const, label:'Mật khẩu mới', showKey:'next' as const },
                { id:'pw-confirm', field:'confirm' as const, label:'Xác nhận mật khẩu mới', showKey:'confirm' as const },
              ].map(({ id, field, label, showKey }) => (
                <div className="form-group" key={field}>
                  <span className="form-icon"><LockIcon /></span>
                  <input
                    id={id}
                    className="form-input form-input--pr"
                    type={showPw[showKey] ? 'text' : 'password'}
                    placeholder={label}
                    value={pwForm[field]}
                    onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                    required
                    autoComplete={field === 'current' ? 'current-password' : 'new-password'}
                  />
                  <span className="form-input-action">
                    <button type="button" className="toggle-pw" onClick={() => setShowPw(p => ({ ...p, [showKey]: !p[showKey] }))}>
                      {showPw[showKey] ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </span>
                </div>
              ))}

              <button id="pw-submit" type="submit" className="btn-primary" disabled={pwLoading} style={{ maxWidth:'240px' }}>
                {pwLoading ? <span className="spinner" /> : <><LockIcon /><span>Cập nhật mật khẩu</span></>}
              </button>
            </form>
          </div>
        )}

        {/* Sổ địa chỉ giao hàng Tab */}
        {activeTab === 'addresses' && (
          <div style={{ background:'white', borderRadius:'1.25rem', padding:'2rem', border:'1px solid #e2e8f0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontSize:'1.125rem', fontWeight:700, color:'#0f172a', margin:0 }}>Sổ địa chỉ nhận hàng</h2>
              <button
                onClick={() => setAddressModal({
                  isOpen: true,
                  mode: 'add',
                  fullName: user.fullName,
                  phone: '',
                  addressLine: '',
                  province: '',
                  district: '',
                  isDefault: false
                })}
                className="btn-primary"
                style={{ maxWidth:'180px', padding:'.5rem 1rem', fontSize:'.8125rem' }}
              >
                ➕ Thêm địa chỉ mới
              </button>
            </div>

            {addressesLoading ? (
              <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
                <span className="spinner" />
              </div>
            ) : addresses.length === 0 ? (
              <div style={{ textAlign:'center', padding:'3rem 1.5rem', color:'#64748b' }}>
                <p style={{ margin:'0 0 1rem 0' }}>Bạn chưa lưu địa chỉ nhận hàng nào.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {addresses.map(addr => (
                  <div
                    key={addr.addressId}
                    style={{
                      border:'1.5px solid ' + (addr.isDefault ? '#3b82f6' : '#e2e8f0'),
                      borderRadius:'1rem', padding:'1.25rem',
                      background: addr.isDefault ? '#f8fafc' : 'white',
                      transition:'all .2s',
                      position:'relative'
                    }}
                  >
                    {addr.isDefault && (
                      <span style={{
                        position:'absolute', top:'1.25rem', right:'1.25rem',
                        background:'#dbeafe', color:'#1e40af',
                        fontSize:'.6875rem', fontWeight:700, padding:'.25rem .625rem', borderRadius:'999px'
                      }}>Mặc định</span>
                    )}

                    <h3 style={{ fontSize:'.9375rem', fontWeight:700, color:'#0f172a', margin:'0 0 .5rem 0', display:'flex', alignItems:'center', gap:'.5rem' }}>
                      {addr.fullName}
                    </h3>
                    
                    <p style={{ fontSize:'.875rem', color:'#475569', margin:'0 0 .25rem 0' }}>
                      📞 <strong>Số điện thoại:</strong> {addr.phone}
                    </p>
                    <p style={{ fontSize:'.875rem', color:'#475569', margin:'0 0 .75rem 0' }}>
                      📍 <strong>Địa chỉ:</strong> {addr.addressLine}, {addr.district}, {addr.province}
                    </p>

                    <div style={{ display:'flex', gap:'.75rem', flexWrap:'wrap' }}>
                      <button
                        onClick={() => {
                          setAddressModal({
                            isOpen: true,
                            mode: 'edit',
                            addressId: addr.addressId,
                            fullName: addr.fullName,
                            phone: addr.phone,
                            addressLine: addr.addressLine,
                            province: addr.province,
                            district: addr.district,
                            isDefault: addr.isDefault
                          });
                          setAddressSearch(addr.addressLine);
                        }}
                        style={{
                          background:'none', border:'none', color:'#4f46e5', fontWeight:600, fontSize:'.8125rem', cursor:'pointer', padding:0
                        }}
                      >
                        ✏️ Sửa
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAddress(addr.addressId)}
                        style={{
                          background:'none', border:'none', color:'#ef4444', fontWeight:600, fontSize:'.8125rem', cursor:'pointer', padding:0
                        }}
                      >
                        🗑️ Xóa
                      </button>

                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefaultAddress(addr.addressId)}
                          style={{
                            background:'none', border:'none', color:'#2563eb', fontWeight:600, fontSize:'.8125rem', cursor:'pointer', padding:0
                          }}
                        >
                          ⭐ Đặt làm mặc định
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa địa chỉ */}
      {addressModal.isOpen && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(15,23,42,.6)', backdropFilter:'blur(4px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          zIndex:1000, padding:'1rem'
        }}>
          <div style={{
            background:'white', borderRadius:'1.5rem', width:'100%', maxWidth:'520px',
            padding:'2rem', boxShadow:'0 20px 25px -5px rgba(0,0,0,.15)',
            position:'relative', maxHeight:'90vh', overflowY:'auto'
          }}>
            <h2 style={{ fontSize:'1.25rem', fontWeight:800, color:'#0f172a', margin:'0 0 1.5rem 0' }}>
              {addressModal.mode === 'add' ? '➕ Thêm địa chỉ mới' : '✏️ Cập nhật địa chỉ'}
            </h2>

            <form onSubmit={handleAddressSave} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'flex', gap:'1rem' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Họ tên người nhận *</label>
                  <input
                    type="text"
                    required
                    style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif' }}
                    value={addressModal.fullName}
                    onChange={e => setAddressModal(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif' }}
                    value={addressModal.phone}
                    onChange={e => setAddressModal(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Tìm kiếm địa chỉ tự động */}
              <div style={{ position:'relative' }}>
                <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Tìm kiếm địa chỉ nhanh (OSM Autocomplete)</label>
                <div style={{ position:'relative' }}>
                  <input
                    type="text"
                    placeholder="Gõ từ 3 ký tự để tìm kiếm..."
                    style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif', paddingRight:'2.5rem' }}
                    value={addressSearch}
                    onChange={e => handleAddressSearchChange(e.target.value)}
                  />
                  {addressSearchLoading && (
                    <span className="spinner" style={{ position:'absolute', right:'.75rem', top:'35%', width:'16px', height:'16px', borderSize:'2px' }} />
                  )}
                </div>
                
                {addressSuggestions.length > 0 && (
                  <div style={{
                    position:'absolute', top:'100%', left:0, right:0, background:'white',
                    border:'1.5px solid #e2e8f0', borderRadius:'.75rem', marginTop:'.25rem',
                    boxShadow:'0 10px 15px -3px rgba(0,0,0,.1)', zIndex:100, maxHeight:'200px', overflowY:'auto'
                  }}>
                    {addressSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleAddressSelect(item)}
                        style={{ padding:'.625rem .875rem', fontSize:'.8125rem', cursor:'pointer', borderBottom:'1px solid #f1f5f9', transition:'background .2s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        📍 {item.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Địa chỉ chi tiết (Số nhà, đường...) *</label>
                <input
                  type="text"
                  required
                  style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif' }}
                  value={addressModal.addressLine}
                  onChange={e => setAddressModal(prev => ({ ...prev, addressLine: e.target.value }))}
                />
              </div>

              <div style={{ display:'flex', gap:'1rem' }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Quận/Huyện *</label>
                  <input
                    type="text"
                    required
                    style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif' }}
                    value={addressModal.district}
                    onChange={e => setAddressModal(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:'.8125rem', fontWeight:600, color:'#475569', display:'block', marginBottom:'.375rem' }}>Tỉnh/Thành phố *</label>
                  <input
                    type="text"
                    required
                    style={{ width:'100%', padding:'.625rem .875rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', fontSize:'.875rem', fontFamily:'Outfit,sans-serif' }}
                    value={addressModal.province}
                    onChange={e => setAddressModal(prev => ({ ...prev, province: e.target.value }))}
                  />
                </div>
              </div>

              {/* ── Mini Map ── */}
              <div style={{ marginTop: '1rem' }}>
                <label style={{ fontSize: '.8125rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '.375rem' }}>🗺️ Chọn vị trí trên bản đồ</label>
                
                {/* Map search bar */}
                <div style={{ position: 'relative', marginBottom: '.5rem' }}>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        placeholder={leafletReady ? 'Gõ tìm địa chỉ trên bản đồ...' : 'Đang tải bản đồ...'}
                        style={{ width: '100%', padding: '.5rem .75rem', borderRadius: '.75rem', border: '1.5px solid #e2e8f0', fontSize: '.8125rem', fontFamily: 'Outfit,sans-serif', paddingRight: '2rem' }}
                        value={addrMapSearch}
                        onChange={handleAddrMapSearchChange}
                        disabled={!leafletReady}
                      />
                      {addrMapSearchLoading && (
                        <span className="spinner" style={{ position: 'absolute', right: '.5rem', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px' }} />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleGpsLocate}
                      disabled={gpsLoading || !leafletReady}
                      style={{
                        padding: '.5rem .75rem', borderRadius: '.75rem', border: '1.5px solid #e2e8f0',
                        background: gpsLoading ? '#f1f5f9' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
                        color: gpsLoading ? '#94a3b8' : 'white', fontFamily: 'Outfit,sans-serif',
                        fontSize: '.75rem', fontWeight: 600, cursor: gpsLoading ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap', transition: 'all .2s'
                      }}
                    >
                      {gpsLoading ? '⏳ Đang định vị...' : '📍 Vị trí của tôi'}
                    </button>
                  </div>
                  
                  {/* Map search suggestions */}
                  {addrMapSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, background: 'white',
                      border: '1.5px solid #e2e8f0', borderRadius: '.75rem', marginTop: '.25rem',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,.1)', zIndex: 100, maxHeight: '180px', overflowY: 'auto'
                    }}>
                      {addrMapSuggestions.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => handleAddrMapSelect(item)}
                          style={{ padding: '.5rem .75rem', fontSize: '.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background .2s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          📍 {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map container */}
                <div
                  ref={addrMapContainerRef}
                  style={{
                    width: '100%', height: '220px', borderRadius: '.75rem', border: '1.5px solid #e2e8f0',
                    overflow: 'hidden', background: '#f1f5f9'
                  }}
                />
                <p style={{ fontSize: '.6875rem', color: '#94a3b8', margin: '.375rem 0 0 0' }}>
                  💡 Nhấp hoặc kéo ghim trên bản đồ để chọn vị trí chính xác
                </p>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:'.5rem', marginTop:'.5rem' }}>
                <input
                  type="checkbox"
                  id="addr-default"
                  checked={addressModal.isDefault}
                  onChange={e => setAddressModal(prev => ({ ...prev, isDefault: e.target.checked }))}
                  style={{ cursor:'pointer' }}
                />
                <label htmlFor="addr-default" style={{ fontSize:'.875rem', color:'#475569', cursor:'pointer', userSelect:'none' }}>Đặt làm địa chỉ nhận hàng mặc định</label>
              </div>

              <div style={{ display:'flex', gap:'.75rem', marginTop:'1.5rem', justifyContent:'flex-end' }}>
                <button
                  type="button"
                  onClick={() => { setAddressModal(prev => ({ ...prev, isOpen: false })); setAddressSearch(''); }}
                  style={{
                    padding:'.625rem 1.25rem', borderRadius:'.75rem', border:'1.5px solid #e2e8f0', background:'white',
                    fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'.875rem', color:'#64748b', cursor:'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    maxWidth:'150px', padding:'.625rem 1.25rem', borderRadius:'.75rem',
                    fontFamily:'Outfit,sans-serif', fontWeight:600, fontSize:'.875rem', border:'none', cursor:'pointer'
                  }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Internal axios helper (re-uses axiosClient) ────────────────────
function axiosClientPut(url: string, data: unknown) {
  return axiosClient.put(url, data);
}
