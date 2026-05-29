import { faCheck, faX } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminUniversityApi } from "../../universities/api/adminUniversityApi";
import type { AdminUniversityListDto } from "../../universities/types/adminUniversity";
import { adminProductApi } from "../api/adminProductApi";
import type {
  AdminBaseProductListDto,
  AdminCreateStoreProductDto,
  AdminStoreProductDto,
  AdminStoreProductListDto,
  AdminUpdateStoreProductDto,
} from "../types/adminProduct";

type StoreProductForm = AdminCreateStoreProductDto & {
  isActive: boolean;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const emptyStoreProductForm: StoreProductForm = {
  baseProductId: null,
  description: "",
  imageUrl: "",
  isActive: true,
  isCustomizable: false,
  name: "",
  price: 0,
  universityId: null,
};

function compactOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return Number(trimmed);
}

function toStoreProductForm(
  product: AdminStoreProductDto | null,
): StoreProductForm {
  if (!product) return emptyStoreProductForm;

  return {
    baseProductId: product.baseProductId,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    isActive: product.isActive,
    isCustomizable: product.isCustomizable,
    name: product.name,
    price: product.price,
    universityId: product.universityId,
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

// ── Multi-image helpers ────────────────────────────────────────
function parseImageUrls(imageUrl: string | null): string[] {
  if (!imageUrl) return [];
  return imageUrl.split('|').filter(Boolean);
}

function joinImageUrls(urls: string[]): string {
  return urls.filter(Boolean).join('|');
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

export function AdminStoreProductsPage() {
  const [products, setProducts] =
    useState<PagedResult<AdminStoreProductListDto> | null>(null);
  const [baseProducts, setBaseProducts] = useState<AdminBaseProductListDto[]>(
    [],
  );
  const [universities, setUniversities] = useState<AdminUniversityListDto[]>(
    [],
  );
  const [selectedProduct, setSelectedProduct] =
    useState<AdminStoreProductDto | null>(null);
  const [form, setForm] = useState<StoreProductForm>(emptyStoreProductForm);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState("");
  const [baseProductFilter, setBaseProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const query = useMemo(
    () => ({
      baseProductId:
        baseProductFilter === "all" ? undefined : Number(baseProductFilter),
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      name: nameFilter.trim() || undefined,
      pageNumber,
      pageSize,
    }),
    [baseProductFilter, nameFilter, pageNumber, pageSize, statusFilter],
  );

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminProductApi.getStoreProducts(query);
      setProducts(result);
    } catch (err) {
      console.error("Failed to load store products", err);
      setProducts(emptyPage(query.pageNumber, query.pageSize));
      setError("Không thể tải danh sách sản phẩm bán.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const loadBaseProducts = useCallback(async () => {
    try {
      const result = await adminProductApi.getBaseProducts({
        isActive: true,
        pageNumber: 1,
        pageSize: 50,
      });
      setBaseProducts(result.data);
    } catch (err) {
      console.error("Failed to load base product options", err);
      setBaseProducts([]);
    }
  }, []);

  const loadUniversities = useCallback(async () => {
    try {
      const result = await adminUniversityApi.getUniversities({
        isActive: true,
        pageNumber: 1,
        pageSize: 50,
      });
      setUniversities(result.data);
    } catch (err) {
      console.error("Failed to load university options", err);
      setUniversities([]);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadProducts(), loadBaseProducts(), loadUniversities()]);
  }, [loadBaseProducts, loadProducts, loadUniversities]);

  const activeCount =
    products?.data.filter((item) => item.isActive).length ?? 0;
  const customizableCount =
    products?.data.filter((item) => item.isCustomizable).length ?? 0;

  const baseProductNameById = useMemo(
    () => new Map(baseProducts.map((item) => [item.baseProductId, item.name])),
    [baseProducts],
  );
  const universityNameById = useMemo(
    () => new Map(universities.map((item) => [item.universityId, item.name])),
    [universities],
  );

  const openProduct = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminProductApi.getStoreProductById(id);
      setSelectedProduct(detail);
      setForm(toStoreProductForm(detail));
    } catch (err) {
      console.error("Failed to load store product detail", err);
      setError("Không thể tải chi tiết sản phẩm.");
    } finally {
      setDetailLoading(false);
    }
  };

  const startCreate = () => {
    setSelectedProduct(null);
    setForm(emptyStoreProductForm);
    setMessage(null);
    setError(null);
  };

  const uploadStoreImage = async (file: File | undefined) => {
    if (!file) return;

    try {
      setImageUploading(true);
      setError(null);
      const imageUrl = await adminProductApi.uploadStoreProductImage(file);
      // Append new image URL to existing pipe-separated list
      setForm((current) => {
        const existingUrls = parseImageUrls(current.imageUrl);
        existingUrls.push(imageUrl);
        return { ...current, imageUrl: joinImageUrls(existingUrls) };
      });
      setMessage("Đã tải ảnh sản phẩm.");
    } catch (err) {
      console.error("Failed to upload store product image", err);
      setError(getApiErrorMessage(err, "Không thể tải ảnh sản phẩm. Vui lòng chọn file ảnh dưới 5MB."));
    } finally {
      setImageUploading(false);
    }
  };

  const removeStoreImage = (indexToRemove: number) => {
    setForm((current) => {
      const existingUrls = parseImageUrls(current.imageUrl);
      existingUrls.splice(indexToRemove, 1);
      return { ...current, imageUrl: joinImageUrls(existingUrls) };
    });
  };

  const submitForm = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      const createPayload: AdminCreateStoreProductDto = {
        baseProductId: form.baseProductId,
        description: compactOptional(form.description ?? ""),
        imageUrl: compactOptional(form.imageUrl ?? ""),
        isCustomizable: form.isCustomizable,
        name: form.name.trim(),
        price: form.price,
        universityId: form.universityId,
      };
      const updatePayload: AdminUpdateStoreProductDto = {
        description: createPayload.description,
        imageUrl: createPayload.imageUrl,
        isActive: form.isActive,
        isCustomizable: form.isCustomizable,
        name: createPayload.name,
        price: createPayload.price,
      };
      const result = selectedProduct
        ? await adminProductApi.updateStoreProduct(
            selectedProduct.productId,
            updatePayload,
          )
        : await adminProductApi.createStoreProduct(createPayload);
      setMessage(result.message);
      await loadProducts();
      if (selectedProduct) {
        await openProduct(selectedProduct.productId);
      } else {
        setForm(emptyStoreProductForm);
      }
    } catch (err) {
      console.error("Failed to save store product", err);
      setError(getApiErrorMessage(err, "Không thể lưu sản phẩm bán."));
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
      const result = await adminProductApi.deleteStoreProduct(
        selectedProduct.productId,
      );
      setMessage(result.message);
      setSelectedProduct(null);
      setForm(emptyStoreProductForm);
      await loadProducts();
    } catch (err) {
      console.error("Failed to delete store product", err);
      setError("Không thể xoá sản phẩm bán.");
    } finally {
      setSaving(false);
    }
  };

  const refreshAll = () =>
    Promise.all([loadProducts(), loadBaseProducts(), loadUniversities()]);

  const previewImageUrls = parseImageUrls(form.imageUrl).map(url => resolveApiAssetUrl(url));

  return (
    <section className="admin-orders-page admin-products-page">
      <div className="admin-dashboard__heading">
        <div>
          <p>Quản lý catalog bán hàng</p>
          <h1 style={{ margin: 0 }}>Quản lý sản phẩm</h1>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => void refreshAll()}
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

      <section className="admin-stat-grid" aria-label="Thống kê sản phẩm">
        <article className="admin-stat-card">
          <div>
            <p>Tổng sản phẩm</p>
            <strong>{products?.totalRecords ?? 0}</strong>
            <span>Trong catalog</span>
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
            <p>Cho custom</p>
            <strong>{customizableCount}</strong>
            <span>Có thể cá nhân hoá</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Trường khả dụng</p>
            <strong>{universities.length}</strong>
            <span>Dùng khi tạo sản phẩm</span>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid admin-products-grid">
        <section className="admin-panel admin-orders-carousel">
          <div className="admin-panel__header admin-orders-toolbar">
            <div>
              <h2>Danh sách sản phẩm</h2>
              <span>Sản phẩm bán nối với base product và trường học</span>
            </div>
            <button
              className="admin-refresh-button"
              type="button"
              onClick={startCreate}
            >
              Tạo sản phẩm mới
            </button>
          </div>
          <div className="admin-orders-controls admin-products-filters">
            <label>
              Tên sản phẩm
              <input
                type="search"
                value={nameFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setNameFilter(event.target.value);
                }}
                placeholder="Áo FPT, hoodie..."
              />
            </label>
            <label>
              Phôi
              <select
                value={baseProductFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setBaseProductFilter(event.target.value);
                }}
              >
                <option value="all">Tất cả</option>
                {baseProducts.map((item) => (
                  <option key={item.baseProductId} value={item.baseProductId}>
                    {item.name}
                  </option>
                ))}
              </select>
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
            <div className="admin-empty-state">Đang tải sản phẩm...</div>
          ) : products && products.data.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-products-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Giá bán</th>
                    <th>Phôi</th>
                    <th>Custom</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.data.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <strong>{product.name}</strong>
                        <span>
                          #{product.productId} ·{" "}
                          {product.universityId
                            ? (universityNameById.get(product.universityId) ??
                              `University #${product.universityId}`)
                            : "Chưa gắn trường"}
                        </span>
                      </td>
                      <td>
                        <strong>{formatCurrency(product.price)}</strong>
                      </td>
                      <td>
                        {product.baseProductId
                          ? (baseProductNameById.get(product.baseProductId) ??
                            `#${product.baseProductId}`)
                          : "Chưa gắn phôi"}
                      </td>
                      <td>
                        <span
                          className={`admin-status admin-status--${product.isCustomizable ? "info" : "warning"}`}
                        >
                          {product.isCustomizable ? (
                            <FontAwesomeIcon
                              icon={faCheck}
                              style={{ color: "green" }}
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faX}
                              style={{ color: "red" }}
                            />
                          )}
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
                            onClick={() => void openProduct(product.productId)}
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
              Không có dữ liệu sản phẩm phù hợp.
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
            <h2>
              {selectedProduct ? "Chi tiết sản phẩm" : "Tạo sản phẩm mới"}
            </h2>
            {detailLoading ? (
              <div className="admin-empty-state">Đang tải chi tiết...</div>
            ) : null}
            <div className="admin-product-form">
              <label>
                Tên sản phẩm
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
                Giá bán
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      price: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <label>
                Phôi
                <select
                  value={form.baseProductId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      baseProductId: optionalNumber(event.target.value),
                    }))
                  }
                  disabled={!!selectedProduct}
                >
                  <option value="">Chưa gắn phôi</option>
                  {baseProducts.map((item) => (
                    <option key={item.baseProductId} value={item.baseProductId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Trường
                <select
                  value={form.universityId ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      universityId: optionalNumber(event.target.value),
                    }))
                  }
                  disabled={!!selectedProduct}
                >
                  <option value="">Chọn trường</option>
                  {universities.map((item) => (
                    <option key={item.universityId} value={item.universityId}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-product-form__wide">
                Mô tả
                <textarea
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="admin-product-form__wide">
                Ảnh sản phẩm (nhiều ảnh)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    void uploadStoreImage(event.target.files?.[0])
                  }
                  disabled={imageUploading}
                />
                {imageUploading ? (
                  <span className="admin-form-hint">Đang tải ảnh...</span>
                ) : previewImageUrls.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {previewImageUrls.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
                        <img src={url || ''} alt={`Ảnh ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {idx === 0 && (
                          <span style={{
                            position: 'absolute', top: '2px', left: '2px',
                            background: '#3b82f6', color: 'white', fontSize: '9px',
                            fontWeight: 700, padding: '1px 4px', borderRadius: '4px'
                          }}>Chính</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStoreImage(idx)}
                          style={{
                            position: 'absolute', top: '2px', right: '2px',
                            width: '20px', height: '20px', borderRadius: '50%',
                            background: 'rgba(239,68,68,0.9)', color: 'white',
                            border: 'none', cursor: 'pointer', fontSize: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, lineHeight: 1
                          }}
                          title="Xóa ảnh này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="admin-form-hint">Chưa tải ảnh. Có thể tải nhiều ảnh.</span>
                )}
              </label>
              <label className="admin-product-checkbox">
                <input
                  type="checkbox"
                  checked={form.isCustomizable}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isCustomizable: event.target.checked,
                    }))
                  }
                />{" "}
                Cho phép custom
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
                  disabled={!selectedProduct}
                />{" "}
                Đang bán
              </label>
              <div className="admin-status-form admin-product-form__wide">
                <button
                  type="button"
                  onClick={() => void submitForm()}
                  disabled={saving || imageUploading || !form.name.trim()}
                >
                  {saving
                    ? "Đang lưu..."
                    : selectedProduct
                      ? "Cập nhật sản phẩm"
                      : "Tạo sản phẩm"}
                </button>
                {selectedProduct ? (
                  <button
                    type="button"
                    onClick={() => void deleteSelectedProduct()}
                    disabled={saving}
                  >
                    Xoá sản phẩm
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

export default AdminStoreProductsPage;
