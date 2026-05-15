import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import type { CartResponseDto, CartItemDto } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/context/AuthContext';

export default function CartPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // State cho mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // 1. Redirect về login nếu chưa đăng nhập
    useEffect(() => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để xem giỏ hàng!');
            navigate('/login', { replace: true });
            return;
        }
        fetchCart();
    }, [user]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const data = await cartApi.getMyCart();
            setCart(data);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
                // axiosClient interceptor sẽ tự redirect về /login
            } else {
                toast.error('Lỗi khi tải giỏ hàng. Vui lòng thử lại!');
            }
        } finally {
            setLoading(false);
        }
    };

    // 2. Xử lý đổi Số lượng
    const handleQuantityChange = async (item: CartItemDto, newQuantity: number) => {
        if (newQuantity < 1) return;
        setCart((prev) => {
            if (!prev) return prev;
            const updatedItems = prev.items.map(i =>
                i.cartItemId === item.cartItemId ? { ...i, quantity: newQuantity } : i
            );
            const newTotal = updatedItems.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
            return { ...prev, items: updatedItems, totalAmount: newTotal };
        });

        try {
            await cartApi.updateCartItem(item.cartItemId, { quantity: newQuantity, size: item.size });
        } catch (error) {
            toast.error('Có lỗi xảy ra, đang tải lại giỏ hàng...');
            fetchCart();
        }
    };

    // 3. Xử lý đổi Size
    const handleSizeChange = async (item: CartItemDto, newSize: string) => {
        try {
            await cartApi.updateCartItem(item.cartItemId, { quantity: item.quantity, size: newSize });
            fetchCart();
            toast.success('Đã cập nhật size');
        } catch (error) {
            toast.error('Lỗi cập nhật size');
        }
    };

    // 4. Xóa Item
    const handleRemoveItem = async (cartItemId: number) => {
        if (!window.confirm('Bạn có chắc muốn bỏ sản phẩm này?')) return;
        try {
            await cartApi.removeCartItem(cartItemId);
            fetchCart();
            toast.success('Đã xóa khỏi giỏ hàng');
        } catch (error) {
            toast.error('Không thể xóa sản phẩm');
        }
    };

    // 5. Xử lý Mã giảm giá
    const handleApplyCoupon = () => {
        if (couponCode === 'ALMA2026') {
            setDiscountAmount(50000);
            toast.success('Áp dụng mã thành công!');
        } else {
            setDiscountAmount(0);
            toast.error('Mã giảm giá không hợp lệ!');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-gray-500">Đang tải giỏ hàng...</div>
            </div>
        );
    }

    const totalItemsCount = cart?.items.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const finalTotal = (cart?.totalAmount || 0) - discountAmount;

    return (
        <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen font-['Outfit']">
            {/* Header (Giữ nguyên cấu trúc của bạn) */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm relative shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden text-gray-500 hover:text-gray-900 focus:outline-none"
                        >
                            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-xl`}></i>
                        </button>
                        <div className="flex-shrink-0 flex items-center ml-4 md:ml-0">
                            <Link to="/" className="flex items-center gap-2">
                                <img src="/images/logo.png" alt="ALMA Logo" className="h-10 w-auto object-contain" />
                                <span className="font-bold text-xl lg:text-2xl text-gray-900 tracking-tight hidden md:block whitespace-nowrap">
                                    ALMA Custom Threads<span className="text-blue-600">.</span>
                                </span>
                            </Link>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <Link to="/" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Trang Chủ</Link>
                            <Link to="/category" className="text-gray-500 hover:text-gray-900 font-medium transition-colors">Sản Phẩm</Link>
                            <Link to="/customizer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold transition-colors">
                                <i className="fa-solid fa-wand-magic-sparkles"></i> Thiết Kế Ngay
                            </Link>
                        </nav>
                        <div className="flex items-center space-x-4">
                            {user ? (
                                <div className="hidden md:flex items-center gap-3">
                                    <Link to="/profile" className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="text-sm font-semibold">{user.fullName}</span>
                                    </Link>
                                    <button
                                        onClick={() => { logout(); navigate('/login'); }}
                                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold rounded-full hover:bg-red-100 transition"
                                    >
                                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                    </button>
                                </div>
                            ) : (
                                <Link to="/login" className="hidden md:flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 text-sm font-semibold rounded-full hover:bg-blue-100 transition">
                                    <i className="fa-regular fa-user"></i> Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b shadow-lg z-40">
                        <div className="px-4 pt-2 pb-4 space-y-1 flex flex-col">
                            <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Trang Chủ</Link>
                            <Link to="/category" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Sản Phẩm</Link>
                            <Link to="/customizer" className="block px-3 py-2 rounded-md text-base font-bold text-indigo-600 hover:bg-indigo-50">
                                <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Thiết Kế Ngay
                            </Link>
                            {user ? (
                                <button
                                    onClick={() => { logout(); navigate('/login'); }}
                                    className="block w-full text-left px-3 py-2 mt-4 rounded-md text-base font-medium text-center text-white bg-red-600 hover:bg-red-700"
                                >
                                    Đăng xuất
                                </button>
                            ) : (
                                <Link to="/login" className="block px-3 py-2 mt-4 rounded-md text-base font-medium text-center text-white bg-blue-600 hover:bg-blue-700">Đăng nhập</Link>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Cart Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                {/* Page Title */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                        <i className="fa-solid fa-cart-shopping text-lg"></i>
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Giỏ Hàng Của Bạn</h1>
                        <p className="text-sm text-gray-500">
                            {cart?.items.length || 0} thiết kế • {totalItemsCount} áo
                        </p>
                    </div>
                </div>

                {(!cart || cart.items.length === 0) ? (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100">
                        <i className="fa-solid fa-cart-arrow-down text-4xl text-gray-300 mb-4"></i>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
                        <p className="text-gray-500 mb-6">Bạn chưa có mẫu thiết kế nào trong giỏ hàng.</p>
                        <Link to="/customizer" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                            <i className="fa-solid fa-wand-magic-sparkles"></i> Bắt đầu thiết kế ngay
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items List */}
                        <div className="flex-1">
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
                                {cart.items.map((item) => (
                                    <div key={item.cartItemId} className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-6">
                                        {/* Product Image */}
                                        <div className="w-32 h-40 bg-gray-50 rounded-xl shrink-0 flex items-center justify-center p-2 relative overflow-hidden border border-gray-200 shadow-inner">
                                            <img
                                                src={item.imageUrl || '/images/default-shirt.png'}
                                                alt="Mockup"
                                                className="w-full h-full object-contain mix-blend-multiply"
                                            />
                                        </div>

                                        {/* Product Details & Actions */}
                                        <div className="flex-1 flex flex-col pt-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{item.productName}</h3>
                                                    <p className="text-sm text-gray-500 mb-2 font-medium">Đơn giá: {item.unitPrice.toLocaleString('vi-VN')}đ</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item.cartItemId)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                    title="Xóa sản phẩm"
                                                >
                                                    <i className="fa-regular fa-trash-can text-lg"></i>
                                                </button>
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-xl mt-4 border border-gray-100">
                                                <div className="flex text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2 pb-2 border-b border-gray-200">
                                                    <div className="w-20">Size</div>
                                                    <div className="w-28 text-center">Số lượng</div>
                                                    <div className="flex-1 text-right">Thành tiền</div>
                                                </div>

                                                <div className="flex items-center text-sm py-2">
                                                    {/* Chỗ này vì giao diện của bạn chỉ hỗ trợ hiển thị 1 size mỗi dòng, 
                                                        mà cấu trúc giỏ hàng hiện tại (mỗi item là 1 size) phù hợp với HTML này */}
                                                    <div className="w-20 font-bold text-gray-800">
                                                        <select
                                                            value={item.size}
                                                            onChange={(e) => handleSizeChange(item, e.target.value)}
                                                            className="bg-transparent font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1 cursor-pointer hover:bg-gray-200 transition-colors"
                                                        >
                                                            <option value="S">S</option>
                                                            <option value="M">M</option>
                                                            <option value="L">L</option>
                                                            <option value="XL">XL</option>
                                                            <option value="XXL">XXL</option>
                                                        </select>
                                                    </div>

                                                    <div className="w-28 flex justify-center">
                                                        <div className="flex items-center border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                                                            <button
                                                                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="text"
                                                                className="w-8 h-8 text-center text-xs font-semibold focus:outline-none bg-transparent"
                                                                value={item.quantity}
                                                                readOnly
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                                                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 text-right font-semibold text-gray-800">
                                                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6">
                                <Link to="/customizer" className="text-blue-600 font-medium hover:text-blue-700 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl transition-colors">
                                    <i className="fa-solid fa-arrow-left-long"></i> Tiếp tục thiết kế áo khác
                                </Link>
                            </div>
                        </div>

                        {/* Order Summary (Bên phải) */}
                        <div className="w-full lg:w-96 shrink-0">
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden sticky top-24">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <i className="fa-solid fa-receipt"></i> Tóm tắt đơn hàng
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between text-gray-600 font-medium text-sm">
                                            <span>Tổng số áo:</span>
                                            <span className="text-gray-900 font-semibold">{totalItemsCount} áo</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span>Phí in:</span>
                                            <span className="text-green-600 font-semibold">Miễn phí</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span>Tạm tính phí áo:</span>
                                            <span className="font-semibold text-gray-900">{(cart.totalAmount).toLocaleString('vi-VN')}đ</span>
                                        </div>

                                        {/* Coupon Section */}
                                        <div className="pt-4 border-t border-gray-200 border-dashed flex flex-col gap-2">
                                            <label className="text-sm font-semibold text-gray-800">Mã giảm giá</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã voucher..."
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="bg-gray-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition shadow-sm"
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                            {discountAmount > 0 && (
                                                <div className="flex justify-between text-green-600 text-sm mt-2">
                                                    <span>Đã giảm:</span>
                                                    <span className="font-semibold">- {discountAmount.toLocaleString('vi-VN')}đ</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-5 mb-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-lg font-bold text-gray-900">Tổng Vốn:</span>
                                            <span className="text-2xl font-black text-red-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <p className="text-xs text-gray-500 text-right">(Chưa bao gồm phí vận chuyển)</p>
                                    </div>

                                    <Link to="/checkout" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-lg gap-2">
                                        Tiến hành thanh toán <i className="fa-solid fa-arrow-right ml-1"></i>
                                    </Link>

                                    {/* Trust badges */}
                                    <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400"><i className="fa-solid fa-lock text-green-500"></i> Bảo mật</div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400"><i className="fa-solid fa-truck text-blue-500"></i> Giao nhanh</div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400"><i className="fa-solid fa-shield text-indigo-500"></i> Bảo hành</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 mt-auto pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
                        <div className="flex flex-col gap-6">
                            <Link to="/" className="flex items-center gap-3">
                                <img src="/images/logo.png" alt="ALMA Logo" className="h-12 w-auto object-contain bg-white rounded-lg p-1.5 shadow-md" />
                                <span className="font-extrabold text-2xl text-white tracking-tight">ALMA<span className="text-blue-500">.</span></span>
                            </Link>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-sm">Nền tảng thiết kế đồng phục hàng đầu dành cho học sinh, sinh viên.</p>
                        </div>
                        <div className="flex flex-col gap-6">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider relative inline-block after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-12 after:h-1 after:bg-blue-500 after:rounded-full">Liên Hệ</h3>
                            <div className="text-gray-400 text-sm space-y-4 mt-2">
                                <p className="flex items-start gap-3 hover:text-white transition-colors"><i className="fa-solid fa-location-dot mt-1 text-blue-500 text-lg w-5 text-center"></i> <span>Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</span></p>
                                <p className="flex items-center gap-3 hover:text-white transition-colors"><i className="fa-solid fa-phone text-blue-500 text-lg w-5 text-center"></i> <a href="tel:0123456789" className="font-semibold text-lg">0123 456 789</a></p>
                                <p className="flex items-center gap-3 hover:text-white transition-colors"><i className="fa-solid fa-envelope text-blue-500 text-lg w-5 text-center"></i> <a href="mailto:contact@almacustom.vn">contact@almacustom.vn</a></p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 items-start md:items-end">
                            <h3 className="text-white font-bold text-lg uppercase tracking-wider relative inline-block after:content-[''] after:absolute after:-bottom-2 after:right-0 after:w-12 after:h-1 after:bg-blue-500 after:rounded-full">Kết Nối</h3>
                            <div className="flex gap-4 mt-2">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-all hover:-translate-y-1 shadow-lg"><i className="fa-brands fa-facebook-f"></i></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-pink-500 hover:to-purple-600 transition-all hover:-translate-y-1 shadow-lg"><i className="fa-brands fa-instagram"></i></a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-black transition-all hover:-translate-y-1 shadow-lg"><i className="fa-brands fa-tiktok"></i></a>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <i className="fa-brands fa-cc-visa text-2xl text-gray-600"></i>
                                <i className="fa-brands fa-cc-mastercard text-2xl text-gray-600"></i>
                                <i className="fa-brands fa-cc-paypal text-2xl text-gray-600"></i>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-500">&copy; 2026 ALMA Custom Threads. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-gray-500">
                            <a href="#" className="hover:text-blue-400 transition-colors">Chính sách bảo mật</a>
                            <a href="#" className="hover:text-blue-400 transition-colors">Điều khoản dịch vụ</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}