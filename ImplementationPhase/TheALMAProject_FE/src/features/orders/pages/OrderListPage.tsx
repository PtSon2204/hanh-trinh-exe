// src/features/orders/pages/OrderListPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../api/orderApi';
import type { OrderResponseDto } from '../types/index';
import type { PagedResult } from '../../../shared/types/pagination';

// ─── Status Config (driven by API values) ────────────────────────────────────

interface StatusConfig {
  label: string;
  badge: string;       // badge pill classes
  glow: string;        // card left-border accent
  icon: string;        // font-awesome icon
  bg: string;          // subtle card bg tint
  payIcon: string;
}

const ORDER_STATUS_MAP: Record<string, StatusConfig> = {
  Pending: {
    label: 'Chờ xác nhận',
    badge: 'bg-amber-100 text-amber-700 border-amber-300 shadow-amber-200/60',
    glow: 'border-l-amber-400',
    icon: 'fa-clock',
    bg: 'from-amber-50/40 to-transparent',
    payIcon: 'fa-clock',
  },
  Processing: {
    label: 'Đang xử lý',
    badge: 'bg-blue-100 text-blue-700 border-blue-300 shadow-blue-200/60',
    glow: 'border-l-blue-400',
    icon: 'fa-hourglass-half',
    bg: 'from-blue-50/40 to-transparent',
    payIcon: 'fa-clock',
  },
  Confirmed: {
    label: 'Đã xác nhận',
    badge: 'bg-sky-100 text-sky-700 border-sky-300 shadow-sky-200/60',
    glow: 'border-l-sky-400',
    icon: 'fa-circle-check',
    bg: 'from-sky-50/40 to-transparent',
    payIcon: 'fa-clock',
  },
  Shipping: {
    label: 'Đang giao hàng',
    badge: 'bg-violet-100 text-violet-700 border-violet-300 shadow-violet-200/60',
    glow: 'border-l-violet-400',
    icon: 'fa-truck-fast',
    bg: 'from-violet-50/40 to-transparent',
    payIcon: 'fa-clock',
  },
  Delivered: {
    label: 'Đã giao',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-emerald-200/60',
    glow: 'border-l-emerald-400',
    icon: 'fa-box-open',
    bg: 'from-emerald-50/40 to-transparent',
    payIcon: 'fa-circle-check',
  },
  Cancelled: {
    label: 'Đã huỷ',
    badge: 'bg-red-100 text-red-600 border-red-300 shadow-red-200/60',
    glow: 'border-l-red-400',
    icon: 'fa-ban', 
    bg: 'from-red-50/30 to-transparent',
    payIcon: 'fa-xmark',
  },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  Pending: { label: 'Chờ thanh toán', color: 'text-amber-600', icon: 'fa-clock' },
  Paid: { label: 'Đã thanh toán', color: 'text-emerald-600', icon: 'fa-circle-check' },
  Failed: { label: 'Thất bại', color: 'text-red-500', icon: 'fa-xmark-circle' },
  Refunded: { label: 'Đã hoàn tiền', color: 'text-slate-500', icon: 'fa-rotate-left' },
};

function resolveOrderStatus(raw: string): StatusConfig {
  return ORDER_STATUS_MAP[raw] ?? {
    label: raw,
    badge: 'bg-gray-100 text-gray-600 border-gray-300 shadow-gray-200/60',
    glow: 'border-l-gray-300',
    icon: 'fa-circle-question',
    bg: 'from-gray-50/30 to-transparent',
    payIcon: 'fa-circle-question',
  };
}

function resolvePaymentStatus(raw: string) {
  return PAYMENT_STATUS_MAP[raw] ?? { label: raw, color: 'text-gray-500', icon: 'fa-circle-question' };
}

// ─── Filter tabs built dynamically from API data ──────────────────────────────

const ALL_STATUSES = Object.keys(ORDER_STATUS_MAP); // ['Processing','Confirmed',...]

// ─── Component ────────────────────────────────────────────────────────────────

const OrderListPage = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState<PagedResult<OrderResponseDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderApi.getMyOrders({ pageNumber: 1, pageSize: 50 });
        setOrderData(data);
      } catch (err) {
        console.error('Lỗi khi tải đơn hàng:', err);
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const orders = orderData?.data ?? [];

  const filteredOrders = activeTab === 'All'
    ? orders
    : orders.filter((o) => o.orderStatus === activeTab);

  // Count per status from actual API data
  const countByStatus = (status: string) =>
    status === 'All' ? orders.length : orders.filter((o) => o.orderStatus === status).length;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <div className="space-y-4 mt-8 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-50" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-gray-100 rounded-full w-1/3" />
                <div className="h-4 bg-gray-100 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-6 animate-pulse">Đang tải đơn hàng...</p>
      </PageShell>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5 shadow-lg shadow-red-100">
            <i className="fa-solid fa-triangle-exclamation text-red-400 text-3xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Đã có lỗi xảy ra</h3>
          <p className="text-sm text-gray-500 mb-6 text-center max-w-xs">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 text-sm transition-all"
          >
            <i className="fa-solid fa-rotate-right mr-2" /> Thử lại
          </button>
        </div>
      </PageShell>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <PageShell>

      {/* ── Hero header ────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 shadow-2xl shadow-indigo-500/30">
        {/* decorative blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-1">
              <i className="fa-solid fa-bag-shopping mr-2" />Tài khoản của bạn
            </p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Đơn hàng của tôi</h1>
            <p className="text-blue-200 text-sm mt-1">
              {orders.length > 0 ? `${orders.length} đơn hàng được tìm thấy` : 'Chưa có đơn hàng nào'}
            </p>
          </div>
          <button
            onClick={() => navigate('/customizer')}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-bold px-5 py-2.5 rounded-xl border border-white/20 text-sm transition-all hover:scale-105 active:scale-95"
          >
            <i className="fa-solid fa-pen-ruler" /> Thiết kế mới
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 no-scrollbar">
        {/* "Tất cả" tab */}
        <FilterTab
          label="Tất cả"
          count={orders.length}
          active={activeTab === 'All'}
          onClick={() => setActiveTab('All')}
          icon="fa-layer-group"
        />
        {/* Dynamic tabs from known statuses — only show if count > 0 */}
        {ALL_STATUSES.map((status) => {
          const cnt = countByStatus(status);
          return (
            <FilterTab
              key={status}
              label={ORDER_STATUS_MAP[status].label}
              count={cnt}
              active={activeTab === status}
              onClick={() => setActiveTab(status)}
              icon={ORDER_STATUS_MAP[status].icon}
            />
          );
        })}
      </div>

      {/* ── Empty State ────────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shadow-lg shadow-blue-100">
              <i className="fa-solid fa-bag-shopping text-blue-400 text-4xl" />
            </div>
            <div className="absolute -right-1 -bottom-1 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
              <i className="fa-solid fa-question text-white text-xs" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-gray-800 mb-2">
            {activeTab === 'All' ? 'Chưa có đơn hàng nào' : `Không có đơn "${resolveOrderStatus(activeTab).label}"`}
          </h3>
          <p className="text-sm text-gray-500 mb-8 max-w-xs">
            {activeTab === 'All'
              ? 'Hãy thiết kế và đặt ngay chiếc áo đầu tiên theo phong cách của bạn!'
              : 'Không tìm thấy đơn hàng nào ở trạng thái này.'}
          </p>
          {activeTab === 'All' && (
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => navigate('/customizer')}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 text-sm transition-all hover:-translate-y-0.5"
              >
                <i className="fa-solid fa-pen-ruler" /> Bắt đầu thiết kế
              </button>
              <button
                onClick={() => navigate('/category')}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all hover:-translate-y-0.5"
              >
                <i className="fa-solid fa-shirt" /> Khám phá sản phẩm
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Order Cards ─────────────────────────────────────────────── */
        <div className="flex flex-col gap-4">
          {filteredOrders.map((order, idx) => (
            <OrderCard key={order.orderId} order={order} index={idx} />
          ))}
        </div>
      )}
    </PageShell>
  );
};

// ─── PageShell ────────────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen font-['Outfit'] flex flex-col"
      style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}
    >
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/60 shadow-sm shrink-0 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="ALMA" className="h-9 w-auto object-contain" />
            <span className="font-extrabold text-xl text-gray-900 tracking-tight hidden sm:block">
              ALMA<span className="text-blue-600">.</span>
            </span>
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-2 rounded-xl transition-all"
            >
              <i className="fa-solid fa-house text-xs" />
              <span className="hidden sm:inline">Trang chủ</span>
            </button>
            <button
              onClick={() => navigate('/customizer')}
              className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/25 transition-all hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-pen-ruler text-xs" />
              <span className="hidden sm:inline">Thiết kế ngay</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}

// ─── FilterTab ────────────────────────────────────────────────────────────────

interface FilterTabProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  icon: string;
}

function FilterTab({ label, count, active, onClick, icon }: FilterTabProps) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200
        ${active
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-500/25 scale-105'
          : 'bg-white/70 backdrop-blur-sm text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-white'
        }`}
    >
      <i className={`fa-solid ${icon} text-xs`} />
      {label}
      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full
        ${active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>
        {count}
      </span>
    </button>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderResponseDto;
  index: number;
}

function OrderCard({ order, index }: OrderCardProps) {
  const navigate = useNavigate();
  const sc = resolveOrderStatus(order.orderStatus);
  const pc = resolvePaymentStatus(order.paymentStatus);

  const formattedDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : '—';

  return (
    <div
      className={`
        group relative bg-white rounded-2xl border-l-4 ${sc.glow} border border-gray-100
        shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden
      `}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Gradient tint overlay matching status */}
      <div className={`absolute inset-0 bg-gradient-to-r ${sc.bg} pointer-events-none`} />

      <div className="relative">
        {/* ── Card Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            {/* Status icon circle */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${sc.badge}`}>
              <i className={`fa-solid ${sc.icon} text-sm`} />
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-widest">Mã đơn hàng</p>
              <p className="font-extrabold text-gray-900 text-sm tracking-wide">{order.orderCode}</p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${sc.badge}`}>
            <i className={`fa-solid ${sc.icon} text-[10px]`} />
            {sc.label}
          </span>
        </div>

        {/* Divider */}
        <div className="mx-6 border-t border-gray-100" />

        {/* ── Card Body ── */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4">
          {/* Total Amount */}
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Tổng tiền</p>
            <p className="font-extrabold text-gray-900 text-lg leading-tight">
              {Number(order.totalAmount).toLocaleString('vi-VN')}
              <span className="text-xs font-medium text-gray-400 ml-1">₫</span>
            </p>
          </div>

          {/* Payment Status */}
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Thanh toán</p>
            <p className={`text-sm font-bold flex items-center gap-1.5 ${pc.color}`}>
              <i className={`fa-solid ${pc.icon} text-xs`} />
              {pc.label}
            </p>
          </div>

          {/* Date */}
          <div>
            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Ngày đặt</p>
            <p className="text-sm font-semibold text-gray-600 leading-snug">{formattedDate}</p>
          </div>
        </div>

        {/* ── Card Footer ── */}
        <div className="px-6 pb-5 flex items-center justify-between">
          {/* Status hint */}
          <StatusHint status={order.orderStatus} />

          {/* Detail button */}
          <button
            onClick={() => navigate(`/orders/${order.orderId}`)}
            className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-200
              text-blue-600 bg-blue-50 border border-blue-100
              hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white hover:border-transparent
              hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 group/btn"
          >
            Xem chi tiết
            <i className="fa-solid fa-arrow-right text-xs transition-transform duration-200 group-hover/btn:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatusHint ───────────────────────────────────────────────────────────────

function StatusHint({ status }: { status: string }) {
  const hints: Record<string, { text: string; cls: string }> = {
    Pending: { text: 'Đơn hàng đang chờ xác nhận từ cửa hàng', cls: 'text-amber-500' },
    Processing: { text: 'Cửa hàng đã xác nhận, đang chuẩn bị hàng', cls: 'text-blue-500' },
    Confirmed: { text: 'Cửa hàng đã chuẩn bị xong hàng', cls: 'text-sky-500' },
    Shipping: { text: 'Đơn hàng đang trên đường đến bạn', cls: 'text-violet-500' },
    Delivered: { text: 'Đơn hàng đã giao thành công 🎉', cls: 'text-emerald-600' },
    Cancelled: { text: 'Đơn hàng đã bị huỷ', cls: 'text-red-500' },
  };
  const h = hints[status];
  if (!h) return null;
  return (
    <p className={`text-xs font-medium italic ${h.cls} flex items-center gap-1.5`}>
      <i className={`fa-solid ${ORDER_STATUS_MAP[status]?.icon ?? 'fa-circle-info'} text-[10px]`} />
      {h.text}
    </p>
  );
}

export default OrderListPage;
