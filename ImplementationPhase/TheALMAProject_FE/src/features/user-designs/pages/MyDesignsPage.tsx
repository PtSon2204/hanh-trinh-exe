// src/features/user-designs/pages/MyDesignsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userDesignApi } from '../api/userDesignApi';
import type { UserDesignResponseDto } from '../types/userDesign';
import { resolveApiAssetUrl } from '../../../shared/api/axiosClient';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'ordered' | 'draft';

const FILTER_TABS: { label: string; value: FilterTab; icon: string }[] = [
  { label: 'Tất cả', value: 'all', icon: 'fa-layer-group' },
  { label: 'Đã đặt hàng', value: 'ordered', icon: 'fa-circle-check' },
  { label: 'Bản nháp', value: 'draft', icon: 'fa-pen-to-square' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const MyDesignsPage = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState<UserDesignResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const data = await userDesignApi.getMyDesigns();
        setDesigns(data);
      } catch (err) {
        console.error('Lỗi khi tải thiết kế:', err);
        setError('Không thể tải danh sách thiết kế. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchDesigns();
  }, []);

  const handleDelete = async (designId: number) => {
    setDeletingId(designId);
    try {
      await userDesignApi.deleteDesign(designId);
      setDesigns((prev) => prev.filter((d) => d.designId !== designId));
      toast.success('Đã xoá thiết kế thành công!');
    } catch {
      toast.error('Không thể xoá thiết kế. Vui lòng thử lại.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  const filtered = designs.filter((d) => {
    if (activeTab === 'ordered') return d.isOrdered;
    if (activeTab === 'draft') return !d.isOrdered;
    return true;
  });

  const counts = {
    all: designs.length,
    ordered: designs.filter((d) => d.isOrdered).length,
    draft: designs.filter((d) => !d.isOrdered).length,
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-['Outfit'] flex flex-col">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Đang tải thiết kế...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 font-['Outfit'] flex flex-col">
        <PageHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-red-100 shadow-lg p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-triangle-exclamation text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Đã có lỗi xảy ra</h3>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 font-['Outfit'] flex flex-col">
      <PageHeader />

      {/* Confirm Delete Modal */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100 animate-fade-in-up">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fa-solid fa-trash text-red-500 text-xl" />
            </div>
            <h3 className="text-lg font-extrabold text-gray-900 mb-2">Xoá thiết kế?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Hành động này không thể hoàn tác. Thiết kế sẽ bị xoá vĩnh viễn.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Huỷ bỏ
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={deletingId === confirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDelete ? (
                  <i className="fa-solid fa-spinner fa-spin" />
                ) : (
                  <i className="fa-solid fa-trash" />
                )}
                Xoá thiết kế
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Title */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Lịch sử thiết kế
            </h1>
            <p className="text-sm text-gray-500 mt-1">{designs.length} thiết kế của bạn</p>
          </div>
          <button
            onClick={() => navigate('/customizer')}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all transform hover:-translate-y-0.5"
          >
            <i className="fa-solid fa-plus" />
            Tạo thiết kế mới
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all
                ${activeTab === tab.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`} />
              {tab.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full
                ${activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {counts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-5">
              <i className="fa-solid fa-pen-ruler text-blue-400 text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              {activeTab === 'all' ? 'Chưa có thiết kế nào' : activeTab === 'ordered' ? 'Chưa có thiết kế nào được đặt hàng' : 'Không có bản nháp'}
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              {activeTab === 'all'
                ? 'Hãy bắt đầu sáng tạo và tạo ra chiếc áo theo phong cách riêng của bạn!'
                : 'Không có thiết kế nào trong mục này.'}
            </p>
            {activeTab === 'all' && (
              <button
                onClick={() => navigate('/customizer')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all"
              >
                <i className="fa-solid fa-pen-ruler mr-2" />
                Bắt đầu thiết kế
              </button>
            )}
          </div>
        ) : (
          /* Design Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((design) => (
              <DesignCard
                key={design.designId}
                design={design}
                onDelete={() => setConfirmDelete(design.designId)}
                onEdit={() => navigate(`/customizer?designId=${design.designId}`)}
                onAddToCart={() => navigate(`/customizer?designId=${design.designId}&action=cart`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader() {
  const navigate = useNavigate();
  return (
    <header className="bg-white border-b border-gray-100 shadow-sm shrink-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" alt="ALMA Logo" className="h-9 w-auto object-contain" />
          <span className="font-bold text-xl text-gray-900 tracking-tight hidden sm:block">
            ALMA Custom Threads<span className="text-blue-600">.</span>
          </span>
        </a>

        {/* Nav actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-200"
          >
            <i className="fa-solid fa-house text-xs" />
            <span className="hidden sm:inline">Trang chủ</span>
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors bg-gray-50 hover:bg-blue-50 px-3 py-2 rounded-xl border border-gray-200 hover:border-blue-200"
          >
            <i className="fa-solid fa-bag-shopping text-xs" />
            <span className="hidden sm:inline">Đơn hàng</span>
          </button>
          <button
            onClick={() => navigate('/customizer')}
            className="flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition-all"
          >
            <i className="fa-solid fa-plus text-xs" />
            <span className="hidden sm:inline">Thiết kế mới</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface DesignCardProps {
  design: UserDesignResponseDto;
  onDelete: () => void;
  onEdit: () => void;
  onAddToCart: () => void;
}

function DesignCard({ design, onDelete, onEdit, onAddToCart }: DesignCardProps) {
  const previewUrl = resolveApiAssetUrl(design.previewImageUrl);

  const formattedDate = design.createdAt
    ? new Date(design.createdAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '—';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden group flex flex-col">

      {/* Preview Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-blue-50/30 overflow-hidden">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={design.designName ?? 'Thiết kế'}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <i className="fa-solid fa-shirt text-gray-300 text-5xl" />
            <p className="text-xs text-gray-400 font-medium">Chưa có ảnh preview</p>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {design.isOrdered ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-green-500 text-white shadow-sm shadow-green-500/30">
              <i className="fa-solid fa-circle-check text-[9px]" /> Đã đặt hàng
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400 text-white shadow-sm shadow-amber-400/30">
              <i className="fa-solid fa-pen-to-square text-[9px]" /> Bản nháp
            </span>
          )}
        </div>

        {/* Delete button - appears on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
          title="Xoá thiết kế"
        >
          <i className="fa-solid fa-trash text-[11px]" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 text-sm truncate mb-1">
          {design.designName ?? `Thiết kế #${design.designId}`}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400">
            <i className="fa-regular fa-calendar mr-1" />
            {formattedDate}
          </span>
          <span className="text-sm font-black text-blue-600">
            {Number(design.totalEstimatedPrice).toLocaleString('vi-VN')}
            <span className="text-[10px] font-medium text-gray-400 ml-0.5">đ</span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {!design.isOrdered && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 py-2 rounded-xl transition-all"
            >
              <i className="fa-solid fa-pen-to-square" />
              Chỉnh sửa
            </button>
          )}
          <button
            onClick={onAddToCart}
            className={`flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2 rounded-xl transition-all shadow-sm shadow-blue-500/20 ${design.isOrdered ? 'flex-1' : 'px-3'}`}
          >
            <i className="fa-solid fa-cart-plus" />
            {design.isOrdered ? 'Đặt lại' : 'Thêm vào giỏ'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyDesignsPage;
