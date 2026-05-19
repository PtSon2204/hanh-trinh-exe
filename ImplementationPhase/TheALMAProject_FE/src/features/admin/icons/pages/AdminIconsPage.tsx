import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminIconApi } from "../api/adminIconApi";
import type { AdminIconDto, AdminIconListDto, AdminIconMutationDto } from "../types/adminIcon";

type IconForm = AdminIconMutationDto & {
  imagePreviewUrl: string | null;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const emptyIconForm: IconForm = {
  category: "Sticker",
  imageFile: null,
  imagePreviewUrl: null,
  isActive: true,
  name: "",
  priceAddon: 0,
};

function emptyPage<T>(pageNumber: number, pageSize: number): PagedResult<T> {
  return {
    data: [],
    pageNumber,
    pageSize,
    totalPages: 1,
    totalRecords: 0,
  };
}

function toIconForm(icon: AdminIconDto | null): IconForm {
  if (!icon) return emptyIconForm;

  return {
    category: icon.category,
    imageFile: null,
    imagePreviewUrl: icon.imageUrl,
    isActive: icon.isActive,
    name: icon.name,
    priceAddon: icon.priceAddon,
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function AdminIconsPage() {
  const [icons, setIcons] = useState<PagedResult<AdminIconListDto> | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<AdminIconDto | null>(null);
  const [form, setForm] = useState<IconForm>(emptyIconForm);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      category: categoryFilter.trim() || undefined,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      name: nameFilter.trim() || undefined,
      pageNumber,
      pageSize,
    }),
    [categoryFilter, nameFilter, pageNumber, pageSize, statusFilter],
  );

  const loadIcons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminIconApi.getIcons(query);
      setIcons(result);
    } catch (err) {
      console.error("Failed to load admin stickers", err);
      setIcons(emptyPage(query.pageNumber, query.pageSize));
      setError("Không thể tải danh sách stickers.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadIcons();
  }, [loadIcons]);

  useEffect(() => {
    if (!form.imageFile) {
      setLocalPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.imageFile);
    setLocalPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.imageFile]);

  const activeCount = icons?.data.filter((item) => item.isActive).length ?? 0;
  const categories = useMemo(
    () => Array.from(new Set(icons?.data.map((item) => item.category).filter(Boolean) ?? [])),
    [icons],
  );

  const startCreate = () => {
    setSelectedIcon(null);
    setForm(emptyIconForm);
    setMessage(null);
    setError(null);
  };

  const openIcon = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminIconApi.getIconById(id);
      setSelectedIcon(detail);
      setForm(toIconForm(detail));
    } catch (err) {
      console.error("Failed to load sticker detail", err);
      setError("Không thể tải chi tiết sticker.");
    } finally {
      setDetailLoading(false);
    }
  };

  const submitForm = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload: AdminIconMutationDto = {
        category: form.category.trim(),
        imageFile: form.imageFile,
        isActive: form.isActive,
        name: form.name.trim(),
        priceAddon: form.priceAddon,
      };

      const result = selectedIcon
        ? await adminIconApi.updateIcon(selectedIcon.iconId, payload)
        : await adminIconApi.createIcon(payload);

      setMessage(result.message);
      await loadIcons();
      if (selectedIcon) {
        await openIcon(selectedIcon.iconId);
      } else {
        setForm(emptyIconForm);
      }
    } catch (err) {
      console.error("Failed to save sticker", err);
      setError(getApiErrorMessage(err, "Không thể lưu sticker."));
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedIcon = async () => {
    if (!selectedIcon) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const result = await adminIconApi.deleteIcon(selectedIcon.iconId);
      setMessage(result.message);
      setSelectedIcon(null);
      setForm(emptyIconForm);
      await loadIcons();
    } catch (err) {
      console.error("Failed to delete sticker", err);
      setError(getApiErrorMessage(err, "Không thể xoá sticker."));
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = localPreviewUrl ?? resolveApiAssetUrl(form.imagePreviewUrl);

  return (
    <section className="admin-orders-page admin-products-page">
      <div className="admin-dashboard__heading">
        <div>
          <p>Quản lý sticker dùng trong thiết kế</p>
          <h1 style={{ margin: 0 }}>Quản lý Stickers</h1>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => void loadIcons()}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại data"}
        </button>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {message ? <div className="admin-success-alert" role="status">{message}</div> : null}

      <section className="admin-stat-grid" aria-label="Thống kê stickers">
        <article className="admin-stat-card">
          <div>
            <p>Tổng stickers</p>
            <strong>{icons?.totalRecords ?? 0}</strong>
            <span>Trong thư viện</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Đang bật</p>
            <strong>{activeCount}</strong>
            <span>Trên trang hiện tại</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Nhóm hiển thị</p>
            <strong>{categories.length}</strong>
            <span>Từ dữ liệu trang này</span>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid admin-products-grid">
        <section className="admin-panel admin-orders-carousel">
          <div className="admin-panel__header admin-orders-toolbar">
            <div>
              <h2>Danh sách stickers</h2>
              <span>Sticker/biểu tượng có thể kéo thả vào thiết kế</span>
            </div>
            <button className="admin-refresh-button" type="button" onClick={startCreate}>
              Tạo sticker mới
            </button>
          </div>

          <div className="admin-orders-controls admin-products-filters">
            <label>
              Tên sticker
              <input
                type="search"
                value={nameFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setNameFilter(event.target.value);
                }}
                placeholder="Logo, mascot..."
              />
            </label>
            <label>
              Nhóm
              <input
                value={categoryFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setCategoryFilter(event.target.value);
                }}
                placeholder="Sticker"
              />
            </label>
            <label>
              Trạng thái
              <select
                value={statusFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setStatusFilter(event.target.value);
                }}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang bật</option>
                <option value="inactive">Tạm tắt</option>
              </select>
            </label>
            <label>
              Page size
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageNumber(1);
                  setPageSize(Number(event.target.value));
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="admin-empty-state">Đang tải stickers...</div>
          ) : icons && icons.data.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-products-table admin-icons-table">
                <thead>
                  <tr>
                    <th>Sticker</th>
                    <th>Phụ phí</th>
                    <th>Nhóm</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {icons.data.map((icon) => (
                    <tr key={icon.iconId}>
                      <td>
                        <div className="admin-icon-cell">
                          <span className="admin-icon-thumb">
                            {resolveApiAssetUrl(icon.imageUrl) ? (
                              <img src={resolveApiAssetUrl(icon.imageUrl) ?? ""} alt="" />
                            ) : null}
                          </span>
                          <div>
                            <strong>{icon.name}</strong>
                            <span>#{icon.iconId}</span>
                          </div>
                        </div>
                      </td>
                      <td><strong>{formatCurrency(icon.priceAddon)}</strong></td>
                      <td>{icon.category}</td>
                      <td>
                        <span className={`admin-status admin-status--${icon.isActive ? "success" : "danger"}`}>
                          {icon.isActive ? "Đang bật" : "Tạm tắt"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" onClick={() => void openIcon(icon.iconId)}>
                            Chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">Không có sticker phù hợp.</div>
          )}

          <div className="admin-pagination">
            <button
              type="button"
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
              disabled={loading || pageNumber <= 1}
            >
              Trang trước
            </button>
            <button
              type="button"
              onClick={() =>
                setPageNumber((current) =>
                  icons ? Math.min(icons.totalPages || 1, current + 1) : current + 1,
                )
              }
              disabled={loading || (!!icons?.totalPages && pageNumber >= icons.totalPages)}
            >
              Trang sau
            </button>
          </div>
        </section>

        <aside className="admin-orders-side">
          <section className="admin-panel">
            <h2>{selectedIcon ? "Chi tiết sticker" : "Tạo sticker mới"}</h2>
            {detailLoading ? <div className="admin-empty-state">Đang tải chi tiết...</div> : null}
            <div className="admin-product-form">
              <label>
                Tên sticker
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Phụ phí
                <input
                  type="number"
                  min="0"
                  value={form.priceAddon}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, priceAddon: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="admin-product-form__wide">
                Nhóm
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                />
              </label>
              <label className="admin-product-form__wide">
                Ảnh sticker
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imageFile: event.target.files?.[0] ?? null,
                    }))
                  }
                />
                {previewUrl ? (
                  <div className="admin-product-image-preview">
                    <img src={previewUrl} alt="Ảnh sticker" />
                    <a href={previewUrl} target="_blank" rel="noreferrer">Xem ảnh</a>
                  </div>
                ) : (
                  <span className="admin-form-hint">Chưa chọn ảnh.</span>
                )}
              </label>
              <label className="admin-product-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, isActive: event.target.checked }))
                  }
                />{" "}
                Đang bật
              </label>
              <div className="admin-status-form admin-product-form__wide">
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={saving || !form.name.trim() || !form.category.trim()}
                >
                  {saving ? "Đang lưu..." : selectedIcon ? "Cập nhật sticker" : "Tạo sticker"}
                </button>
                {selectedIcon ? (
                  <button type="button" onClick={() => void deleteSelectedIcon()} disabled={saving}>
                    Xoá sticker
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AdminIconsPage;
