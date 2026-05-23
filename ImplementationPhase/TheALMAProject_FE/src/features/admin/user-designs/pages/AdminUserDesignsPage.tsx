import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getApiErrorMessage,
  resolveApiAssetUrl,
} from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { AdminShell } from "../../components/AdminShell";
import { adminUserDesignApi } from "../api/adminUserDesignApi";
import type {
  AdminUserDesignDto,
  AdminUserDesignListDto,
} from "../types/adminUserDesign";

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function emptyPage<T>(pageNumber: number, pageSize: number): PagedResult<T> {
  return {
    data: [],
    pageNumber,
    pageSize,
    totalPages: 1,
    totalRecords: 0,
  };
}

function formatDate(value: string | null) {
  if (!value) return "Chưa rõ";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";

  return dateFormatter.format(date);
}

function getCanvasSummary(canvasJson: string) {
  const trimmed = canvasJson.trim();
  if (!trimmed) return "Không có canvas JSON.";

  return trimmed.length > 420 ? `${trimmed.slice(0, 420)}...` : trimmed;
}

export default function AdminUserDesignsPage() {
  const [designs, setDesigns] = useState<PagedResult<AdminUserDesignListDto> | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<AdminUserDesignDto | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadDesigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminUserDesignApi.getUserDesigns({ pageNumber, pageSize });
      setDesigns(result);
    } catch (err) {
      console.error("Failed to load admin user designs", err);
      setDesigns(emptyPage(pageNumber, pageSize));
      setError(getApiErrorMessage(err, "Không thể tải danh sách mẫu thiết kế user."));
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize]);

  useEffect(() => {
    void loadDesigns();
  }, [loadDesigns]);

  const filteredDesigns = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const items = designs?.data ?? [];
    if (!query) return items;

    return items.filter((item) => {
      const fields = [
        item.designName ?? "",
        item.userEmail,
        item.baseProductName,
        String(item.designId),
      ];

      return fields.some((field) => field.toLowerCase().includes(query));
    });
  }, [designs, searchText]);

  const orderedCount = designs?.data.filter((item) => item.isOrdered).length ?? 0;
  const draftCount = (designs?.data.length ?? 0) - orderedCount;

  const openDesign = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminUserDesignApi.getUserDesignById(id);
      setSelectedDesign(detail);
    } catch (err) {
      console.error("Failed to load user design detail", err);
      setError(getApiErrorMessage(err, "Không thể tải chi tiết mẫu thiết kế."));
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteSelectedDesign = async () => {
    if (!selectedDesign) return;

    const confirmed = window.confirm(
      `Xoá mẫu thiết kế #${selectedDesign.designId}? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);
      setMessage(null);
      const result = await adminUserDesignApi.deleteUserDesign(selectedDesign.designId);
      setMessage(result.message);
      setSelectedDesign(null);
      await loadDesigns();
    } catch (err) {
      console.error("Failed to delete user design", err);
      setError(getApiErrorMessage(err, "Không thể xoá mẫu thiết kế."));
    } finally {
      setDeleting(false);
    }
  };

  const previewUrl = resolveApiAssetUrl(selectedDesign?.previewImageUrl ?? null);
  const printFileUrl = resolveApiAssetUrl(selectedDesign?.printFileUrl ?? null);

  return (
    <AdminShell activePath="/admin/designs" searchPlaceholder="Tìm mẫu thiết kế, email, sản phẩm...">
      <section className="admin-orders-page admin-user-designs-page">
        <div className="admin-dashboard__heading">
          <div>
            <p>Kiểm duyệt & quản lý thiết kế cá nhân hoá</p>
            <h1 className="admin-page-title">Mẫu thiết kế User</h1>
          </div>
          <button
            className="admin-refresh-button"
            type="button"
            onClick={() => void loadDesigns()}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Tải lại data"}
          </button>
        </div>

        {error ? <div className="admin-alert" role="alert">{error}</div> : null}
        {message ? <div className="admin-success-alert" role="status">{message}</div> : null}

        <section className="admin-stat-grid" aria-label="Thống kê mẫu thiết kế user">
          <article className="admin-stat-card">
            <div>
              <p>Tổng mẫu</p>
              <strong>{designs?.totalRecords ?? 0}</strong>
              <span>Trong hệ thống</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div>
              <p>Đã lên đơn</p>
              <strong>{orderedCount}</strong>
              <span>Trên trang hiện tại</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div>
              <p>Bản nháp</p>
              <strong>{draftCount}</strong>
              <span>Chưa được đặt hàng</span>
            </div>
          </article>
        </section>

        <div className="admin-orders-grid admin-user-designs-grid">
          <section className="admin-panel admin-orders-carousel">
            <div className="admin-panel__header admin-orders-toolbar">
              <div>
                <h2>Danh sách thiết kế</h2>
                <span>Quản lý các bản thiết kế do user tạo trong editor.</span>
              </div>
            </div>

            <div className="admin-orders-controls admin-products-filters">
              <label>
                Tìm trên trang hiện tại
                <input
                  type="search"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Email, tên mẫu, mã thiết kế..."
                />
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
              <div className="admin-empty-state">Đang tải mẫu thiết kế...</div>
            ) : filteredDesigns.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-products-table admin-user-designs-table">
                  <thead>
                    <tr>
                      <th>Thiết kế</th>
                      <th>User</th>
                      <th>Sản phẩm nền</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDesigns.map((design) => (
                      <tr key={design.designId}>
                        <td>
                          <div className="admin-icon-cell">
                            <span className="admin-design-thumb">
                              {resolveApiAssetUrl(design.previewImageUrl) ? (
                                <img src={resolveApiAssetUrl(design.previewImageUrl) ?? ""} alt="" />
                              ) : null}
                            </span>
                            <div>
                              <strong>{design.designName?.trim() || "Thiết kế chưa đặt tên"}</strong>
                              <span>#{design.designId}</span>
                            </div>
                          </div>
                        </td>
                        <td>{design.userEmail}</td>
                        <td>{design.baseProductName}</td>
                        <td>
                          <span className={`admin-status admin-status--${design.isOrdered ? "success" : "info"}`}>
                            {design.isOrdered ? "Đã lên đơn" : "Bản nháp"}
                          </span>
                        </td>
                        <td>{formatDate(design.createdAt)}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button type="button" onClick={() => void openDesign(design.designId)}>
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
              <div className="admin-empty-state">Không có mẫu thiết kế phù hợp.</div>
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
                    designs ? Math.min(designs.totalPages || 1, current + 1) : current + 1,
                  )
                }
                disabled={loading || (!!designs?.totalPages && pageNumber >= designs.totalPages)}
              >
                Trang sau
              </button>
            </div>
          </section>

          <aside className="admin-orders-side">
            <section className="admin-panel">
              <h2>Chi tiết thiết kế</h2>
              {detailLoading ? <div className="admin-empty-state">Đang tải chi tiết...</div> : null}
              {selectedDesign ? (
                <div className="admin-user-design-detail">
                  <div className="admin-design-preview">
                    {previewUrl ? <img src={previewUrl} alt="Preview thiết kế" /> : <span>Chưa có preview</span>}
                  </div>
                  <dl>
                    <div>
                      <dt>Mã thiết kế</dt>
                      <dd>#{selectedDesign.designId}</dd>
                    </div>
                    <div>
                      <dt>Tên mẫu</dt>
                      <dd>{selectedDesign.designName?.trim() || "Chưa đặt tên"}</dd>
                    </div>
                    <div>
                      <dt>User</dt>
                      <dd>{selectedDesign.userEmail}</dd>
                    </div>
                    <div>
                      <dt>Sản phẩm nền</dt>
                      <dd>{selectedDesign.baseProductName}</dd>
                    </div>
                    <div>
                      <dt>Trạng thái</dt>
                      <dd>{selectedDesign.isOrdered ? "Đã lên đơn" : "Bản nháp"}</dd>
                    </div>
                    <div>
                      <dt>Ngày tạo</dt>
                      <dd>{formatDate(selectedDesign.createdAt)}</dd>
                    </div>
                  </dl>
                  <div className="admin-design-links">
                    {previewUrl ? <a href={previewUrl} target="_blank" rel="noreferrer">Mở preview</a> : null}
                    {printFileUrl ? <a href={printFileUrl} target="_blank" rel="noreferrer">Mở artwork in</a> : null}
                  </div>
                  <div className="admin-data-note">
                    <strong>Canvas JSON</strong>
                    <code>{getCanvasSummary(selectedDesign.canvasJson)}</code>
                  </div>
                  <div className="admin-status-form">
                    <button
                      type="button"
                      onClick={() => void deleteSelectedDesign()}
                      disabled={deleting}
                    >
                      {deleting ? "Đang xoá..." : "Xoá thiết kế"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="admin-empty-state">Chọn một thiết kế để xem preview, canvas JSON và file artwork in.</div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}
