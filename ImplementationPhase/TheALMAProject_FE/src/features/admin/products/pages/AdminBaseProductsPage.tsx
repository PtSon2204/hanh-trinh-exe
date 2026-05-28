import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminProductApi } from "../api/adminProductApi";
import type {
  AdminBaseProductDto,
  AdminBaseProductListDto,
  AdminBaseProductMutationDto,
} from "../types/adminProduct";

type ImageSide = "front" | "back";

type PrintAreaRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ProductPrintArea = Partial<Record<ImageSide, PrintAreaRect>>;

type PrintAreaDrag = {
  side: ImageSide;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  startRect: PrintAreaRect;
  editorWidth: number;
  editorHeight: number;
};

const defaultPrintArea: Record<ImageSide, PrintAreaRect> = {
  front: { x: 0.25, y: 0.22, width: 0.5, height: 0.48 },
  back: { x: 0.25, y: 0.22, width: 0.5, height: 0.48 },
};

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const roundRectValue = (value: number) => Math.round(value * 10000) / 10000;

const normalizePrintAreaRect = (rect: PrintAreaRect): PrintAreaRect => {
  const x = clampNumber(rect.x, 0, 0.98);
  const y = clampNumber(rect.y, 0, 0.98);
  return {
    x: roundRectValue(x),
    y: roundRectValue(y),
    width: roundRectValue(clampNumber(rect.width, 0.02, 1 - x)),
    height: roundRectValue(clampNumber(rect.height, 0.02, 1 - y)),
  };
};

function isPrintAreaRect(value: unknown): value is PrintAreaRect {
  if (!value || typeof value !== "object") return false;
  const rect = value as Record<string, unknown>;
  return ["x", "y", "width", "height"].every(
    (key) => typeof rect[key] === "number" && Number.isFinite(rect[key]),
  );
}

function parsePrintAreaJson(value: string | null): ProductPrintArea | null {
  if (!value?.trim()) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;
    const source = parsed as Record<string, unknown>;
    const area: ProductPrintArea = {};
    if (isPrintAreaRect(source.front)) {
      area.front = normalizePrintAreaRect(source.front);
    }
    if (isPrintAreaRect(source.back)) {
      area.back = normalizePrintAreaRect(source.back);
    }
    return area.front || area.back ? area : null;
  } catch {
    return null;
  }
}

function printAreaToJson(area: ProductPrintArea) {
  return JSON.stringify(area, null, 2);
}

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const emptyBaseProductForm: AdminBaseProductMutationDto = {
  availableColors: "",
  availableSizes: "",
  backImageUrl: "",
  basePrice: 0,
  category: "Áo",
  frontImageUrl: "",
  isActive: true,
  material: "Cotton",
  name: "",
  printAreaJson: null,
};

function compactOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toBaseProductForm(
  product: AdminBaseProductDto | null,
): AdminBaseProductMutationDto {
  if (!product) return emptyBaseProductForm;

  return {
    availableColors: product.availableColors ?? "",
    availableSizes: product.availableSizes ?? "",
    backImageUrl: product.backImageUrl ?? "",
    basePrice: product.basePrice,
    category: product.category,
    frontImageUrl: product.frontImageUrl ?? "",
    isActive: product.isActive,
    material: product.material,
    name: product.name,
    printAreaJson: product.printAreaJson,
  };
}

function normalizeBaseProductForm(
  form: AdminBaseProductMutationDto,
): AdminBaseProductMutationDto {
  return {
    ...form,
    availableColors: compactOptional(form.availableColors ?? ""),
    availableSizes: compactOptional(form.availableSizes ?? ""),
    backImageUrl: compactOptional(form.backImageUrl ?? ""),
    category: form.category.trim(),
    frontImageUrl: compactOptional(form.frontImageUrl ?? ""),
    material: form.material.trim(),
    name: form.name.trim(),
    printAreaJson: compactOptional(form.printAreaJson ?? ""),
  };
}

function splitCsv(value: string | null) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function emptyPage<T>(pageNumber: number, pageSize: number): PagedResult<T> {
  return {
    data: [],
    pageNumber,
    pageSize,
    totalPages: 1,
    totalRecords: 0,
  };
}

function PrintAreaEditor({
  backImageUrl,
  frontImageUrl,
  value,
  onChange,
}: {
  backImageUrl: string | null;
  frontImageUrl: string | null;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const [activeSide, setActiveSide] = useState<ImageSide>("front");
  const [drag, setDrag] = useState<PrintAreaDrag | null>(null);
  const parsedArea = useMemo(
    () => parsePrintAreaJson(value) ?? defaultPrintArea,
    [value],
  );
  const activeRect = parsedArea[activeSide] ?? defaultPrintArea[activeSide];
  const imageUrl = resolveApiAssetUrl(
    activeSide === "front" ? frontImageUrl : backImageUrl,
  );

  const updateArea = useCallback(
    (side: ImageSide, rect: PrintAreaRect) => {
      const nextArea: ProductPrintArea = {
        ...parsedArea,
        [side]: normalizePrintAreaRect(rect),
      };
      onChange(printAreaToJson(nextArea));
    },
    [onChange, parsedArea],
  );

  const ensureSideRect = (side: ImageSide) => {
    const current = parsedArea[side];
    if (current) return;
    onChange(printAreaToJson({ ...parsedArea, [side]: defaultPrintArea[side] }));
  };

  useEffect(() => {
    if (!drag) return;

    const handlePointerMove = (event: globalThis.PointerEvent) => {
      const deltaX = (event.clientX - drag.startX) / drag.editorWidth;
      const deltaY = (event.clientY - drag.startY) / drag.editorHeight;
      const nextRect =
        drag.mode === "move"
          ? {
              ...drag.startRect,
              x: drag.startRect.x + deltaX,
              y: drag.startRect.y + deltaY,
            }
          : {
              ...drag.startRect,
              width: drag.startRect.width + deltaX,
              height: drag.startRect.height + deltaY,
            };
      updateArea(drag.side, nextRect);
    };

    const handlePointerUp = () => setDrag(null);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [drag, updateArea]);

  const startDrag = (
    mode: PrintAreaDrag["mode"],
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const editor = event.currentTarget.closest(".admin-print-area-editor__canvas");
    if (!(editor instanceof HTMLElement)) return;
    const bounds = editor.getBoundingClientRect();
    event.preventDefault();
    setDrag({
      side: activeSide,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startRect: activeRect,
      editorWidth: bounds.width || 1,
      editorHeight: bounds.height || 1,
    });
  };

  return (
    <div className="admin-print-area-editor admin-product-form__wide">
      <div className="admin-print-area-editor__header">
        <div>
          <strong>Vùng in cho khách custom</strong>
          <span>Kéo khung để đặt vùng được phép thêm chữ/sticker.</span>
        </div>
        <div className="admin-print-area-editor__tabs">
          {(["front", "back"] as ImageSide[]).map((side) => (
            <button
              key={side}
              type="button"
              className={activeSide === side ? "is-active" : ""}
              onClick={() => {
                setActiveSide(side);
                ensureSideRect(side);
              }}
            >
              {side === "front" ? "Mặt trước" : "Mặt sau"}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-print-area-editor__stage">
        {imageUrl ? (
          <img src={imageUrl} alt="Ảnh phôi để đặt vùng in" draggable="false" />
        ) : (
          <div className="admin-print-area-editor__empty">
            Tải ảnh phôi để căn vùng in chính xác.
          </div>
        )}
        <div className="admin-print-area-editor__canvas">
          <div
            className="admin-print-area-editor__rect"
            onPointerDown={(event) => startDrag("move", event)}
            style={{
              height: `${activeRect.height * 100}%`,
              left: `${activeRect.x * 100}%`,
              top: `${activeRect.y * 100}%`,
              width: `${activeRect.width * 100}%`,
            }}
          >
            <span>Print area</span>
            <div
              className="admin-print-area-editor__handle"
              onPointerDown={(event) => {
                event.stopPropagation();
                startDrag("resize", event);
              }}
            />
          </div>
        </div>
      </div>

      <div className="admin-print-area-editor__numbers">
        <span>x {activeRect.x}</span>
        <span>y {activeRect.y}</span>
        <span>w {activeRect.width}</span>
        <span>h {activeRect.height}</span>
      </div>
    </div>
  );
}

export function AdminBaseProductsPage() {
  const [products, setProducts] =
    useState<PagedResult<AdminBaseProductListDto> | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<AdminBaseProductDto | null>(null);
  const [form, setForm] =
    useState<AdminBaseProductMutationDto>(emptyBaseProductForm);
  const [uploadingImage, setUploadingImage] = useState<ImageSide | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      name: nameFilter.trim() || undefined,
      pageNumber,
      pageSize,
    }),
    [nameFilter, pageNumber, pageSize, statusFilter],
  );
  const printAreaInvalid = Boolean(
    form.printAreaJson?.trim() && !parsePrintAreaJson(form.printAreaJson),
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminProductApi.getBaseProducts(query);
      setProducts(result);
    } catch (err) {
      console.error("Failed to load base products", err);
      setProducts(emptyPage(query.pageNumber, query.pageSize));
      setError("Không thể tải danh sách phôi sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const activeCount =
    products?.data.filter((item) => item.isActive).length ?? 0;
  const categoryCount = new Set(products?.data.map((item) => item.category))
    .size;

  const openProduct = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminProductApi.getBaseProductById(id);
      setSelectedProduct(detail);
      setForm(toBaseProductForm(detail));
    } catch (err) {
      console.error("Failed to load base product detail", err);
      setError("Không thể tải chi tiết phôi sản phẩm.");
    } finally {
      setDetailLoading(false);
    }
  };

  const startCreate = () => {
    setSelectedProduct(null);
    setForm(emptyBaseProductForm);
    setMessage(null);
    setError(null);
  };

  const uploadBaseImage = async (side: ImageSide, file: File | undefined) => {
    if (!file) return;

    try {
      setUploadingImage(side);
      setError(null);
      const imageUrl = await adminProductApi.uploadBaseProductImage(file);
      setForm((current) => ({
        ...current,
        [side === "front" ? "frontImageUrl" : "backImageUrl"]: imageUrl,
      }));
      setMessage(
        side === "front" ? "Đã tải ảnh mặt trước." : "Đã tải ảnh mặt sau.",
      );
    } catch (err) {
      console.error("Failed to upload base product image", err);
      setError(
        getApiErrorMessage(
          err,
          "Không thể tải ảnh phôi. Vui lòng chọn file ảnh dưới 5MB.",
        ),
      );
    } finally {
      setUploadingImage(null);
    }
  };

  const submitForm = async () => {
    if (printAreaInvalid) {
      setError("PrintAreaJson không hợp lệ. Hãy kéo lại vùng in hoặc sửa JSON.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const payload = normalizeBaseProductForm(form);
      const result = selectedProduct
        ? await adminProductApi.updateBaseProduct(
            selectedProduct.baseProductId,
            payload,
          )
        : await adminProductApi.createBaseProduct(payload);
      setMessage(result.message);
      await loadProducts();
      if (selectedProduct) {
        await openProduct(selectedProduct.baseProductId);
      } else {
        startCreate();
      }
    } catch (err) {
      console.error("Failed to save base product", err);
      setError(getApiErrorMessage(err, "Không thể lưu phôi sản phẩm."));
    } finally {
      setSaving(false);
    }
  };

  const deleteSelectedProduct = async () => {
    if (!selectedProduct) return;

    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const result = await adminProductApi.deleteBaseProduct(
        selectedProduct.baseProductId,
      );
      setMessage(result.message);
      startCreate();
      await loadProducts();
    } catch (err) {
      console.error("Failed to delete base product", err);
      setError("Không thể xoá phôi sản phẩm.");
    } finally {
      setSaving(false);
    }
  };

  const imagePreview = (url: string | null, label: string) => {
    const assetUrl = resolveApiAssetUrl(url);

    return assetUrl ? (
      <div className="admin-product-image-preview">
        <img src={assetUrl} alt={label} />
        <a href={assetUrl} target="_blank" rel="noreferrer">
          Xem ảnh đã tải
        </a>
      </div>
    ) : (
      <span className="admin-form-hint">Chưa tải ảnh.</span>
    );
  };

  return (
    <section className="admin-orders-page admin-products-page">
      <div className="admin-dashboard__heading">
        <div>
          <p>Quản lý dữ liệu sản xuất</p>
          <h1 style={{ margin: 0 }}>Quản lý phôi</h1>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => void loadProducts()}
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại data"}
        </button>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="admin-success-alert" role="status">
          {message}
        </div>
      ) : null}

      <section className="admin-stat-grid" aria-label="Thống kê phôi">
        <article className="admin-stat-card">
          <div>
            <p>Tổng phôi</p>
            <strong>{products?.totalRecords ?? 0}</strong>
            <span>Trong hệ thống</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Đang bán</p>
            <strong>{activeCount}</strong>
            <span>Trên trang hiện tại</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Kiểu dáng</p>
            <strong>{categoryCount}</strong>
            <span>Category khác nhau</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Trang</p>
            <strong>
              {products?.pageNumber ?? pageNumber}/{products?.totalPages ?? 1}
            </strong>
            <span>Page size {pageSize}</span>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid admin-products-grid">
        <section className="admin-panel admin-orders-carousel">
          <div className="admin-panel__header admin-orders-toolbar">
            <div>
              <h2>Danh sách phôi</h2>
              <span>Quản lý base product, vùng in, size và màu dạng CSV</span>
            </div>
            <button
              className="admin-refresh-button"
              type="button"
              onClick={startCreate}
            >
              Tạo phôi mới
            </button>
          </div>
          <div className="admin-orders-controls admin-products-filters">
            <label>
              Tên phôi
              <input
                type="search"
                value={nameFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setNameFilter(event.target.value);
                }}
                placeholder="Áo thun, hoodie..."
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
                <option value="active">Đang bán</option>
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
            <div className="admin-empty-state">Đang tải phôi sản phẩm...</div>
          ) : products && products.data.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-products-table">
                <thead>
                  <tr>
                    <th>Phôi</th>
                    <th>Giá gốc</th>
                    <th>Kiểu dáng</th>
                    <th>Size / màu</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.data.map((product) => (
                    <tr key={product.baseProductId}>
                      <td>
                        <strong>{product.name}</strong>
                        <span>
                          #{product.baseProductId} · {product.material}
                        </span>
                      </td>
                      <td>
                        <strong>{formatCurrency(product.basePrice)}</strong>
                      </td>
                      <td>{product.category}</td>
                      <td>
                        <span>
                          {splitCsv(product.availableSizes).join(", ") ||
                            "Chưa có size"}
                        </span>
                        <span>
                          {splitCsv(product.availableColors).join(", ") ||
                            "Chưa có màu"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status admin-status--${product.isActive ? "success" : "danger"}`}
                        >
                          {product.isActive ? "Đang bán" : "Tạm tắt"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            onClick={() =>
                              void openProduct(product.baseProductId)
                            }
                          >
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
            <div className="admin-empty-state">
              Không có dữ liệu phôi sản phẩm phù hợp.
            </div>
          )}
          <div className="admin-pagination">
            <button
              type="button"
              onClick={() =>
                setPageNumber((current) => Math.max(1, current - 1))
              }
              disabled={loading || pageNumber <= 1}
            >
              Trang trước
            </button>
            <button
              type="button"
              onClick={() =>
                setPageNumber((current) =>
                  products
                    ? Math.min(products.totalPages || 1, current + 1)
                    : current + 1,
                )
              }
              disabled={
                loading ||
                (!!products?.totalPages && pageNumber >= products.totalPages)
              }
            >
              Trang sau
            </button>
          </div>
        </section>

        <aside className="admin-orders-side">
          <section className="admin-panel">
            <h2>{selectedProduct ? "Chi tiết phôi" : "Tạo phôi mới"}</h2>
            {detailLoading ? (
              <div className="admin-empty-state">Đang tải chi tiết...</div>
            ) : null}
            <div className="admin-product-form">
              <label>
                Tên phôi
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Giá gốc
                <input
                  type="number"
                  min="0"
                  value={form.basePrice}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      basePrice: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Kiểu dáng
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Chất liệu
                <input
                  value={form.material}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      material: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Ảnh mặt trước
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void uploadBaseImage("front", event.target.files?.[0])
                  }
                  disabled={uploadingImage !== null}
                />
                {uploadingImage === "front" ? (
                  <span className="admin-form-hint">Đang tải ảnh...</span>
                ) : (
                  imagePreview(form.frontImageUrl, "Ảnh mặt trước")
                )}
              </label>
              <label>
                Ảnh mặt sau
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void uploadBaseImage("back", event.target.files?.[0])
                  }
                  disabled={uploadingImage !== null}
                />
                {uploadingImage === "back" ? (
                  <span className="admin-form-hint">Đang tải ảnh...</span>
                ) : (
                  imagePreview(form.backImageUrl, "Ảnh mặt sau")
                )}
              </label>
              <label>
                Size CSV
                <input
                  value={form.availableSizes ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availableSizes: event.target.value,
                    }))
                  }
                  placeholder="S,M,L,XL"
                />
              </label>
              <label>
                Màu CSV
                <input
                  value={form.availableColors ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      availableColors: event.target.value,
                    }))
                  }
                  placeholder="Trắng,Đen,Cam"
                />
              </label>
              <PrintAreaEditor
                frontImageUrl={form.frontImageUrl}
                backImageUrl={form.backImageUrl}
                value={form.printAreaJson}
                onChange={(printAreaJson) =>
                  setForm((current) => ({
                    ...current,
                    printAreaJson,
                  }))
                }
              />
              <label className="admin-product-form__wide">
                PrintAreaJson
                <textarea
                  value={form.printAreaJson ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      printAreaJson: event.target.value,
                    }))
                  }
                  spellCheck={false}
                  placeholder={'{\n  "front": { "x": 0.25, "y": 0.22, "width": 0.5, "height": 0.48 }\n}'}
                />
                {printAreaInvalid ? (
                  <span className="admin-form-hint admin-form-hint--danger">
                    JSON phải có front/back với x, y, width, height dạng số.
                  </span>
                ) : (
                  <span className="admin-form-hint">
                    Dùng giá trị 0-1 để vùng in tự co giãn theo canvas customizer.
                  </span>
                )}
              </label>
              <label className="admin-product-checkbox">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />{" "}
                Đang bán
              </label>
              <div className="admin-status-form admin-product-form__wide">
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={
                    saving || uploadingImage !== null || !form.name.trim() || printAreaInvalid
                  }
                >
                  {saving
                    ? "Đang lưu..."
                    : selectedProduct
                      ? "Cập nhật phôi"
                      : "Tạo phôi"}
                </button>
                {selectedProduct ? (
                  <button
                    type="button"
                    onClick={() => void deleteSelectedProduct()}
                    disabled={saving}
                  >
                    Xoá phôi
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

export default AdminBaseProductsPage;
