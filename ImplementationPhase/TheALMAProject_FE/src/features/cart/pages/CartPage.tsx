import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartApi } from '../api/cartApi';
import type { CartResponseDto, CartItemDto } from '../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../auth/context/AuthContext';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';
import Navbar from '../../../shared/components/Navbar';
import Footer from '../../../shared/components/Footer';

export default function CartPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState<CartResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    
    // State quản lý việc tích chọn sản phẩm
    const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

    // State cho mã giảm giá
    const [couponCode, setCouponCode] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);

    // 1. Redirect về login nếu chưa đăng nhập & khôi phục các mặt hàng chưa thanh toán nếu có backup
    useEffect(() => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để xem giỏ hàng!');
            navigate('/login', { replace: true });
            return;
        }
        
        const restoreBackupAndLoad = async () => {
            const backup = localStorage.getItem("cart_unchecked_backup");
            if (backup) {
                const toastId = toast.loading("Đang khôi phục lại các sản phẩm trong giỏ hàng...");
                try {
                    const itemsToRestore = JSON.parse(backup);
                    for (const item of itemsToRestore) {
                        await cartApi.addToCart(item);
                    }
                } catch (err) {
                    console.error("Lỗi khôi phục giỏ hàng:", err);
                } finally {
                    localStorage.removeItem("cart_unchecked_backup");
                    toast.dismiss(toastId);
                }
            }
            await fetchCart();
        };

        restoreBackupAndLoad();
    }, [user]);

    const fetchCart = async () => {
        try {
            setLoading(true);
            const data = await cartApi.getMyCart();
            setCart(data);
            if (data && data.items) {
                // Chọn tất cả sản phẩm khi tải lần đầu, những lần sau giữ nguyên các sản phẩm đã được tick chọn
                const validIds = data.items.map(i => i.cartItemId);
                setSelectedItemIds(prev => {
                    if (prev.length === 0) return validIds;
                    return prev.filter(id => validIds.includes(id));
                });
            }
        } catch (error: any) {
            if (error?.response?.status === 401) {
                toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!');
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

    // 6. Xử lý tích chọn sản phẩm riêng lẻ
    const handleSelectItem = (cartItemId: number) => {
        setSelectedItemIds(prev =>
            prev.includes(cartItemId)
                ? prev.filter(id => id !== cartItemId)
                : [...prev, cartItemId]
        );
    };

    // 7. Xử lý tích chọn tất cả (Select All)
    const handleSelectAll = () => {
        if (!cart) return;
        if (selectedItemIds.length === cart.items.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(cart.items.map(i => i.cartItemId));
        }
    };

    // 8. Tiến hành thanh toán chỉ những sản phẩm được tích chọn
    const handleProceedToCheckout = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (selectedItemIds.length === 0) {
            toast.error("Vui lòng tích chọn ít nhất 1 sản phẩm để tiến hành thanh toán!");
            return;
        }

        if (!cart) return;

        const uncheckedItems = cart.items.filter(item => !selectedItemIds.includes(item.cartItemId));
        if (uncheckedItems.length > 0) {
            const toastId = toast.loading("Đang chuẩn bị đơn hàng...");
            try {
                // Sao lưu lại các sản phẩm KHÔNG được chọn
                localStorage.setItem("cart_unchecked_backup", JSON.stringify(uncheckedItems.map(item => ({
                    productId: item.productId || undefined,
                    designId: item.designId || undefined,
                    size: item.size,
                    quantity: item.quantity
                }))));

                // Tạm thời xóa chúng khỏi database giỏ hàng
                for (const item of uncheckedItems) {
                    await cartApi.removeCartItem(item.cartItemId);
                }
                toast.dismiss(toastId);
            } catch (err) {
                toast.dismiss(toastId);
                toast.error("Không thể chuẩn bị giỏ hàng. Vui lòng thử lại!");
                return;
            }
        } else {
            localStorage.removeItem("cart_unchecked_backup");
        }

        navigate("/checkout");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-gray-500">Đang tải giỏ hàng...</div>
            </div>
        );
    }

    // Tính toán số lượng và tổng tiền dựa TRÊN CÁC SẢN PHẨM ĐƯỢC TÍCH CHỌN
    const selectedItems = cart?.items.filter(item => selectedItemIds.includes(item.cartItemId)) || [];
    const totalItemsCount = selectedItems.reduce((acc, item) => acc + item.quantity, 0) || 0;
    const selectedSubTotal = selectedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0) || 0;
    const finalTotal = selectedSubTotal - discountAmount;

    return (
        <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen font-['Outfit']">
            <Navbar />

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
                                {/* Thanh chọn tất cả sản phẩm (Select All) */}
                                <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                                    <label className="flex items-center gap-3 font-bold text-gray-700 text-sm cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={selectedItemIds.length === cart.items.length && cart.items.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                        />
                                        <span>Chọn tất cả ({cart.items.length} thiết kế)</span>
                                    </label>
                                    <span className="text-xs text-gray-400 font-medium">
                                        Đã chọn {selectedItemIds.length} / {cart.items.length} thiết kế
                                    </span>
                                </div>

                                {cart.items.map((item) => (
                                    <div key={item.cartItemId} className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                        {/* Tích chọn sản phẩm */}
                                        <div className="flex items-center self-center shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.includes(item.cartItemId)}
                                                onChange={() => handleSelectItem(item.cartItemId)}
                                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                                            />
                                        </div>
                                        {/* Product Image */}
                                        <div className="w-44 h-52 bg-gray-50 rounded-xl shrink-0 flex items-center justify-center p-2 relative overflow-hidden border border-gray-200 shadow-inner">
                                            <img
                                                src={resolveApiAssetUrl(item.imageUrl) || '/images/default-shirt.png'}
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
                                            <span className="font-semibold text-gray-900">{selectedSubTotal.toLocaleString('vi-VN')}đ</span>
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

                                    <button
                                        onClick={handleProceedToCheckout}
                                        disabled={selectedItemIds.length === 0}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 flex items-center justify-center text-lg gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        Tiến hành thanh toán <i className="fa-solid fa-arrow-right ml-1"></i>
                                    </button>

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
            <Footer />
        </div>
    );
}