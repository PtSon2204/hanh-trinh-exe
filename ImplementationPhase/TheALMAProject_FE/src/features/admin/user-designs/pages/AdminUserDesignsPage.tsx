import { fabric } from "fabric";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getApiErrorMessage,
  resolveApiAssetUrl,
} from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { AdminShell } from "../../components/AdminShell";
import { adminProductApi } from "../../products/api/adminProductApi";
import type { AdminBaseProductDto } from "../../products/types/adminProduct";
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

const CANVAS_PREVIEW_WIDTH = 800;
const CANVAS_PREVIEW_HEIGHT = 1000;
const DESIGN_PREVIEW_BOX = {
  left: CANVAS_PREVIEW_WIDTH * 0.2,
  top: CANVAS_PREVIEW_HEIGHT * 0.18,
  width: CANVAS_PREVIEW_WIDTH * 0.6,
  height: CANVAS_PREVIEW_HEIGHT * 0.65,
};

type FabricCanvasJson = {
  objects?: unknown[];
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

function formatDate(value: string | null) {
  if (!value) return "Chưa rõ";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa rõ";

  return dateFormatter.format(date);
}

function countCanvasObjects(canvasJson: string | null | undefined) {
  if (!canvasJson?.trim()) return 0;

  try {
    const parsed = JSON.parse(canvasJson) as { objects?: unknown[] };
    return Array.isArray(parsed.objects) ? parsed.objects.length : 0;
  } catch {
    return 0;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function openDesignPreviewExport(
  title: string,
  images: Array<{ label: string; url: string | null }>,
) {
  const resolvedImages = images.filter(
    (image): image is { label: string; url: string } => Boolean(image.url),
  );
  if (resolvedImages.length === 0) return false;

  const previewWindow = window.open("", "_blank");
  if (!previewWindow) return false;
  previewWindow.opener = null;

  const safeTitle = escapeHtml(title);
  const body = resolvedImages
    .map(
      (image) => `
        <section class="preview-section">
          <h2>${escapeHtml(image.label)}</h2>
          <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.label)}" />
        </section>`,
    )
    .join("");

  previewWindow.document.write(`<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <style>
          body { margin: 0; padding: 28px; background: #0b1220; color: #e5eefb; font-family: Arial, sans-serif; }
          h1 { margin: 0 0 22px; font-size: 24px; }
          .preview-section { margin-bottom: 36px; padding: 18px; border: 1px solid rgba(148,163,184,.28); border-radius: 18px; background: #111827; }
          .preview-section h2 { margin: 0 0 14px; font-size: 18px; }
          img { display: block; max-width: 100%; height: auto; margin: 0 auto; border-radius: 12px; background: #fff; }
        </style>
      </head>
      <body>
        <h1>${safeTitle}</h1>
        ${body}
      </body>
    </html>`);
  previewWindow.document.close();
  previewWindow.focus();
  return true;
}

function openDesignPreviewExportFromList(design: AdminUserDesignListDto) {
  const title = `${design.designName?.trim() || "Thiết kế chưa đặt tên"} · Design #${design.designId}`;
  return openDesignPreviewExport(title, [
    {
      label: "Front Preview",
      url: resolveApiAssetUrl(design.frontPreviewImageUrl ?? design.previewImageUrl),
    },
    {
      label: "Back Preview",
      url: resolveApiAssetUrl(design.backPreviewImageUrl),
    },
  ]);
}

type CanvasPreviewCardProps = {
  canvasJson: string | null | undefined;
  label: string;
  productImageUrl: string | null;
  savedPreviewUrl?: string | null;
};

function loadPreviewImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Cannot load preview image: ${url}`));
    image.src = url;
  });
}

function drawContainedImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  boxLeft: number,
  boxTop: number,
  boxWidth: number,
  boxHeight: number,
) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  const left = boxLeft + (boxWidth - width) / 2;
  const top = boxTop + (boxHeight - height) / 2;
  ctx.drawImage(image, left, top, width, height);
}

function CanvasPreviewCard({ canvasJson, label, productImageUrl, savedPreviewUrl }: CanvasPreviewCardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectCount = useMemo(() => countCanvasObjects(canvasJson), [canvasJson]);

  useEffect(() => {
    if (savedPreviewUrl) return undefined;

    const canvasElement = canvasRef.current;
    if (!canvasElement) return undefined;
    const ctx = canvasElement.getContext("2d");
    if (!ctx) return undefined;

    const artworkCanvasElement = document.createElement("canvas");
    artworkCanvasElement.width = CANVAS_PREVIEW_WIDTH;
    artworkCanvasElement.height = CANVAS_PREVIEW_HEIGHT;

    const artworkCanvas = new fabric.StaticCanvas(artworkCanvasElement, {
      backgroundColor: "transparent",
      height: CANVAS_PREVIEW_HEIGHT,
      width: CANVAS_PREVIEW_WIDTH,
    });

    let cancelled = false;

    async function renderPreview() {
      const productImage = productImageUrl ? await loadPreviewImage(productImageUrl).catch(() => null) : null;
      if (cancelled) return;

      ctx.clearRect(0, 0, CANVAS_PREVIEW_WIDTH, CANVAS_PREVIEW_HEIGHT);
      if (productImage) {
        drawContainedImage(ctx, productImage, 60, 0, 680, 1000);
      }

      artworkCanvas.renderAll();
      ctx.drawImage(
        artworkCanvasElement,
        DESIGN_PREVIEW_BOX.left,
        DESIGN_PREVIEW_BOX.top,
        DESIGN_PREVIEW_BOX.width,
        DESIGN_PREVIEW_BOX.height,
      );
      setError(null);
    }

    const json = canvasJson?.trim();
    if (!json) {
      artworkCanvas.clear();
      void renderPreview();
      return () => {
        cancelled = true;
        artworkCanvas.dispose();
      };
    }

    let parsedJson: FabricCanvasJson;
    try {
      const parsed = JSON.parse(json) as unknown;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Canvas JSON is not an object");
      }
      parsedJson = parsed as FabricCanvasJson;
    } catch {
      artworkCanvas.clear();
      void renderPreview().then(() => {
        if (!cancelled) setError("Không thể đọc dữ liệu preview.");
      });
      return () => {
        cancelled = true;
        artworkCanvas.dispose();
      };
    }

    artworkCanvas.loadFromJSON(
      parsedJson,
      () => {
        void renderPreview();
      },
      (_object: unknown, instance: fabric.Object) => {
        instance.selectable = false;
        instance.evented = false;
      },
    );

    return () => {
      cancelled = true;
      artworkCanvas.dispose();
    };
  }, [canvasJson, productImageUrl, savedPreviewUrl]);

  return (
    <article className="admin-canvas-preview-card">
      <div className="admin-canvas-preview-card__header">
        <strong>{label}</strong>
        <span>{objectCount > 0 ? `${objectCount} object` : "Trống"}</span>
      </div>
      <div className="admin-canvas-preview-card__stage">
        {savedPreviewUrl ? (
          <img src={savedPreviewUrl} alt={label} />
        ) : (
          <canvas
            ref={canvasRef}
            width={CANVAS_PREVIEW_WIDTH}
            height={CANVAS_PREVIEW_HEIGHT}
            aria-label={label}
          />
        )}
        {!savedPreviewUrl && !canvasJson?.trim() && !productImageUrl ? <span>Chưa có preview</span> : null}
        {error ? <span>{error}</span> : null}
      </div>
    </article>
  );
}

export default function AdminUserDesignsPage() {
  const [designs, setDesigns] = useState<PagedResult<AdminUserDesignListDto> | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<AdminUserDesignDto | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBaseProduct, setSelectedBaseProduct] = useState<AdminBaseProductDto | null>(null);
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
      setSelectedBaseProduct(null);
      const detail = await adminUserDesignApi.getUserDesignById(id);
      setSelectedDesign(detail);
      try {
        const baseProduct = await adminProductApi.getBaseProductById(detail.baseProductId);
        setSelectedBaseProduct(baseProduct);
      } catch (productErr) {
        console.error("Failed to load base product for user design preview", productErr);
        setError(getApiErrorMessage(productErr, "Không thể tải ảnh sản phẩm nền cho preview."));
      }
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
      setSelectedBaseProduct(null);
      await loadDesigns();
    } catch (err) {
      console.error("Failed to delete user design", err);
      setError(getApiErrorMessage(err, "Không thể xoá mẫu thiết kế."));
    } finally {
      setDeleting(false);
    }
  };

  const frontPreviewUrl = resolveApiAssetUrl(selectedDesign?.frontPreviewImageUrl ?? selectedDesign?.previewImageUrl ?? null);
  const backPreviewUrl = resolveApiAssetUrl(selectedDesign?.backPreviewImageUrl ?? null);
  const productFrontImageUrl = resolveApiAssetUrl(selectedBaseProduct?.frontImageUrl ?? null);
  const productBackImageUrl = resolveApiAssetUrl(selectedBaseProduct?.backImageUrl ?? null);

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
                    {filteredDesigns.map((design) => {
                      const thumbnailUrl = resolveApiAssetUrl(
                        design.frontPreviewImageUrl ?? design.previewImageUrl,
                      );

                      return <tr key={design.designId}>
                        <td>
                          <div className="admin-icon-cell">
                            <span className="admin-design-thumb">
                              {thumbnailUrl ? (
                                <img src={thumbnailUrl} alt="" />
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
                            <button
                              type="button"
                              onClick={() => {
                                if (!openDesignPreviewExportFromList(design)) {
                                  setError("Thiết kế này chưa có preview để xuất.");
                                }
                              }}
                            >
                              Xuất preview
                            </button>
                          </div>
                        </td>
                      </tr>;
                    })}
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

          <aside className="admin-orders-side admin-user-designs-side">
            <section className="admin-panel admin-user-design-detail-panel">
              <h2>Chi tiết thiết kế</h2>
              {detailLoading ? <div className="admin-empty-state">Đang tải chi tiết...</div> : null}
              {selectedDesign ? (
                <div className="admin-user-design-detail">
                  <dl className="admin-user-design-meta">
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
                    <button
                      className="admin-design-export-button"
                      type="button"
                      onClick={() => {
                        const opened = openDesignPreviewExport(
                          `${selectedDesign.designName?.trim() || "Thiết kế chưa đặt tên"} · Design #${selectedDesign.designId}`,
                          [
                            { label: "Front Preview", url: frontPreviewUrl },
                            { label: "Back Preview", url: backPreviewUrl },
                          ],
                        );
                        if (!opened) {
                          setError("Thiết kế này chưa có preview hai mặt để xuất.");
                        }
                      }}
                    >
                      Xuất preview hai mặt
                    </button>
                  </div>
                  <section className="admin-canvas-preview-grid" aria-label="Preview hai mặt thiết kế">
                    <CanvasPreviewCard
                      label="Front Preview"
                      canvasJson={selectedDesign.frontCanvasJson ?? selectedDesign.canvasJson}
                      productImageUrl={productFrontImageUrl}
                      savedPreviewUrl={frontPreviewUrl}
                    />
                    <CanvasPreviewCard
                      label="Back Preview"
                      canvasJson={selectedDesign.backCanvasJson}
                      productImageUrl={productBackImageUrl}
                      savedPreviewUrl={backPreviewUrl}
                    />
                  </section>
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
                <div className="admin-empty-state">Chọn một thiết kế để xem preview hai mặt và file artwork in.</div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}
