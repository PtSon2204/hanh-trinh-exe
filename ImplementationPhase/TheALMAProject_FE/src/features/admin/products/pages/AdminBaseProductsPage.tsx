import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage, resolveApiAssetUrl } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminProductApi } from "../api/adminProductApi";
import type {
  AdminBaseProductDto,
  AdminBaseProductListDto,
  AdminBaseProductMutationDto,
} from "../types/adminProduct";

type ImageSide = "front" | "back";

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
              {/* PrintAreaJson is nullable in the backend and will be generated by a visual editor later. */}
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
                    saving || uploadingImage !== null || !form.name.trim()
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
