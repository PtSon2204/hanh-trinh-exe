import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosClient from "../../../shared/api/axiosClient";
import { cartApi } from "../../cart/api/cartApi";
import type { CartResponseDto } from "../../cart/types/index";

const CheckoutPage = () => {
    const navigate = useNavigate();
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
        shipProvince: "Hà Nội",
        shipDistrict: "Quận 1"
    });

    const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "COD">("VIETQR");

    // ── QR Modal state ────────────────────────────────────────────────────────
    const [qrData, setQrData] = useState<{ isOpen: boolean; url: string; orderId: number | null; amount: number }>({
        isOpen: false,
        url: "",
        orderId: null,
        amount: 0,
    });

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
                shipProvince: `${shippingInfo.shipProvince} - ${shippingInfo.shipDistrict}`,
                shipAddress: shippingInfo.shipAddress,
                paymentMethod,
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
                    amount: cart?.totalAmount ?? 0,
                });
                toast.success("Tạo đơn thành công! Vui lòng quét mã QR để thanh toán.");

            } else {
                // COD — clear cart rồi navigate
                await clearCartSilently();
                toast.success("Đặt hàng thành công! Đang chuyển đến trang theo dõi...");
                navigate("/orders");
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
    };

    // ── Tính tiền ─────────────────────────────────────────────────────────────
    const shippingFee = 30000;
    const subTotal = cart?.totalAmount ?? 0;
    const total = subTotal + shippingFee;

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
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-location-dot text-blue-500"></i> Địa chỉ nhận hàng
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <input type="text" name="shipName" required value={shippingInfo.shipName} onChange={handleInputChange} placeholder="Họ và tên" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div>
                                    <input type="tel" name="shipPhone" required value={shippingInfo.shipPhone} onChange={handleInputChange} placeholder="Số điện thoại" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <input type="text" name="shipAddress" required value={shippingInfo.shipAddress} onChange={handleInputChange} placeholder="Địa chỉ chi tiết (Số nhà, đường...)" className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 text-sm" />
                                </div>
                                <div>
                                    <select name="shipProvince" value={shippingInfo.shipProvince} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 text-sm">
                                        <option value="Hà Nội">Hà Nội</option>
                                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                                        <option value="Đà Nẵng">Đà Nẵng</option>
                                    </select>
                                </div>
                                <div>
                                    <select name="shipDistrict" value={shippingInfo.shipDistrict} onChange={handleInputChange} className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 text-sm">
                                        <option value="Quận 1">Quận 1</option>
                                        <option value="Quận Thanh Xuân">Quận Thanh Xuân</option>
                                    </select>
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
                                                        <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
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
                                                <p className="text-xs text-gray-500">Size: {item.size}</p>
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                                                {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Totals */}
                            <div className="border-t border-gray-200 pt-5 space-y-3 mb-5">
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Tạm tính</span>
                                    <span className="font-medium text-gray-900">{subTotal.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Phí vận chuyển</span>
                                    <span className="font-medium text-gray-900">{shippingFee.toLocaleString('vi-VN')}đ</span>
                                </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center relative border border-gray-100">

                        <div className="mb-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fa-solid fa-qrcode text-3xl text-blue-600"></i>
                            </div>
                            <h3 className="text-2xl font-extrabold text-gray-900">Quét mã thanh toán</h3>
                            <p className="text-gray-500 text-sm mt-1">Mở ứng dụng ngân hàng để quét mã</p>
                        </div>

                        {/* QR Image */}
                        <div className="bg-white p-3 rounded-2xl inline-block mb-6 border-2 border-gray-100 shadow-sm">
                            <img
                                src={qrData.url}
                                alt="VietQR Payment"
                                className="w-64 h-64 object-contain rounded-xl"
                                onError={(e) => {
                                    // Fallback nếu ảnh lỗi
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-gray-600 mb-1">Số tiền cần thanh toán</p>
                            <p className="text-2xl font-black text-blue-600">{qrData.amount.toLocaleString('vi-VN')} VNĐ</p>
                            <p className="text-xs text-red-500 italic mt-2">* Vui lòng không sửa nội dung chuyển khoản</p>
                        </div>

                        {qrData.orderId && (
                            <p className="text-xs text-gray-400 mb-4">Mã đơn: #{qrData.orderId}</p>
                        )}

                        <button
                            onClick={async () => {
                                await clearCartSilently();
                                setQrData({ ...qrData, isOpen: false });
                                navigate("/orders");
                            }}
                            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                            <i className="fa-solid fa-check"></i> Tôi đã thanh toán xong
                        </button>

                        <button
                            onClick={() => setQrData({ ...qrData, isOpen: false })}
                            className="mt-3 w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                        >
                            Thanh toán sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckoutPage;