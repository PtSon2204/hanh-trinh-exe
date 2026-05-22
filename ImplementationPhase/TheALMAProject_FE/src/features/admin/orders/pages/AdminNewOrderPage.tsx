import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../shared/api/axiosClient";
import { AdminShell } from "../../components/AdminShell";
import { adminProductApi } from "../../products/api/adminProductApi";
import type { AdminStoreProductListDto } from "../../products/types/adminProduct";
import { adminUserApi } from "../../users/api/adminUserApi";
import type { AdminUserListDto } from "../../users/types/adminUser";
import { adminOrderApi } from "../api/adminOrderApi";
import type { AdminCreateOrderDto, AdminOrderDto } from "../types/adminOrder";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const orderStatusOptions = ["Pending", "Processing"];

const paymentMethodOptions = ["COD", "VNPAY", "VIETQR"];

const paymentStatusOptions = ["Pending", "Unpaid", "Paid"];

type OrderDraftItem = {
  localId: string;
  productId: string;
  designId: string;
  quantity: number;
  size: string;
  unitPrice: number;
};

type OrderFormState = {
  discountAmount: number;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  shipAddress: string;
  shipName: string;
  shipPhone: string;
  shipProvince: string;
  shippingFee: number;
  voucherId: string;
};

const emptyOrderForm: OrderFormState = {
  discountAmount: 0,
  orderStatus: "Pending",
  paymentMethod: "COD",
  paymentStatus: "Pending",
  shipAddress: "",
  shipName: "",
  shipPhone: "",
  shipProvince: "",
  shippingFee: 0,
  voucherId: "",
};

function createDraftItem(product?: AdminStoreProductListDto): OrderDraftItem {
  return {
    designId: "",
    localId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product ? String(product.productId) : "",
    quantity: 1,
    size: "",
    unitPrice: product?.price ?? 0,
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function parseOptionalId(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function sanitizeMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value;
}

function buildCreateOrderPayload(
  selectedCustomer: AdminUserListDto | null,
  form: OrderFormState,
  items: OrderDraftItem[],
): { error: string | null; payload: AdminCreateOrderDto | null } {
  if (!selectedCustomer) {
    return {
      error: "Vui lòng chọn khách hàng trước khi tạo đơn.",
      payload: null,
    };
  }

  if (!form.shipName.trim()) {
    return { error: "Vui lòng nhập tên người nhận.", payload: null };
  }

  if (!form.shipPhone.trim()) {
    return { error: "Vui lòng nhập số điện thoại nhận hàng.", payload: null };
  }

  if (!form.shipAddress.trim()) {
    return { error: "Vui lòng nhập địa chỉ nhận hàng.", payload: null };
  }

  if (!form.shipProvince.trim()) {
    return { error: "Vui lòng nhập tỉnh/thành giao hàng.", payload: null };
  }

  if (!form.paymentMethod.trim()) {
    return { error: "Vui lòng nhập phương thức thanh toán.", payload: null };
  }

  if (items.length === 0) {
    return { error: "Đơn hàng cần tối thiểu một sản phẩm.", payload: null };
  }

  const normalizedItems = items.map((item, index) => {
    const productId = parseOptionalId(item.productId);
    const designId = parseOptionalId(item.designId);

    if (!productId && !designId) {
      return {
        error: `Dòng sản phẩm #${index + 1} cần chọn sản phẩm hoặc nhập design ID.`,
        item: null,
      };
    }

    if (!item.size.trim()) {
      return {
        error: `Dòng sản phẩm #${index + 1} cần nhập size.`,
        item: null,
      };
    }

    if (!Number.isFinite(item.quantity) || item.quantity < 1) {
      return {
        error: `Số lượng của dòng sản phẩm #${index + 1} phải từ 1 trở lên.`,
        item: null,
      };
    }

    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      return {
        error: `Đơn giá của dòng sản phẩm #${index + 1} không hợp lệ.`,
        item: null,
      };
    }

    return {
      error: null,
      item: {
        designId,
        productId,
        quantity: item.quantity,
        size: item.size.trim(),
        unitPrice: sanitizeMoney(item.unitPrice),
      },
    };
  });

  const invalidEntry = normalizedItems.find((entry) => entry.error || !entry.item);
  if (invalidEntry?.error) {
    return { error: invalidEntry.error, payload: null };
  }

  return {
    error: null,
    payload: {
      discountAmount: sanitizeMoney(form.discountAmount),
      items: normalizedItems.flatMap((entry) => (entry.item ? [entry.item] : [])),
      orderStatus: form.orderStatus,
      paymentMethod: form.paymentMethod.trim(),
      paymentStatus: form.paymentStatus,
      shipAddress: form.shipAddress.trim(),
      shipName: form.shipName.trim(),
      shipPhone: form.shipPhone.trim(),
      shipProvince: form.shipProvince.trim(),
      shippingFee: sanitizeMoney(form.shippingFee),
      userId: selectedCustomer.userId,
      voucherId: parseOptionalId(form.voucherId),
    },
  };
}

export function AdminNewOrderPage() {
  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<AdminUserListDto[]>([]);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [createdOrder, setCreatedOrder] = useState<AdminOrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormState>(emptyOrderForm);
  const [items, setItems] = useState<OrderDraftItem[]>([createDraftItem()]);
  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<AdminStoreProductListDto[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminUserListDto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      setCustomersError(null);

      const result = await adminUserApi.getUsers({
        pageNumber: 1,
        pageSize: 50,
        role: "Customer",
      });

      setCustomers(result.data);
    } catch (err) {
      console.error("Failed to load customer options", err);
      setCustomers([]);
      setCustomersError(
        getApiErrorMessage(err, "Không thể tải danh sách khách hàng."),
      );
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);

      const result = await adminProductApi.getStoreProducts({
        isActive: true,
        pageNumber: 1,
        pageSize: 50,
      });

      setProducts(result.data);
    } catch (err) {
      console.error("Failed to load store product options", err);
      setProducts([]);
      setProductsError(
        getApiErrorMessage(err, "Không thể tải danh sách sản phẩm."),
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([loadCustomers(), loadProducts()]);
  }, [loadCustomers, loadProducts]);

  const filteredCustomers = useMemo(() => {
    const query = normalizeSearch(customerQuery);
    if (!query) return customers;

    return customers.filter((customer) => {
      const fields = [customer.email, customer.fullName, customer.phone ?? ""];
      return fields.some((field) => field.toLowerCase().includes(query));
    });
  }, [customerQuery, customers]);

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(productQuery);
    if (!query) return products;

    return products.filter((product) =>
      [product.name, String(product.productId)].some((field) =>
        field.toLowerCase().includes(query),
      ),
    );
  }, [productQuery, products]);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.productId, product])),
    [products],
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + sanitizeMoney(item.unitPrice) * Math.max(item.quantity, 0),
        0,
      ),
    [items],
  );

  const total = useMemo(
    () => subtotal + sanitizeMoney(form.shippingFee) - sanitizeMoney(form.discountAmount),
    [form.discountAmount, form.shippingFee, subtotal],
  );

  const shownCustomers = filteredCustomers.slice(0, 8);
  const shownProducts = filteredProducts.slice(0, 8);

  const reloadLookupData = () => Promise.all([loadCustomers(), loadProducts()]);

  const selectCustomer = (customer: AdminUserListDto) => {
    setSelectedCustomer(customer);
    setCreatedOrder(null);
    setError(null);
    setForm((current) => ({
      ...current,
      shipName: customer.fullName,
      shipPhone: customer.phone ?? current.shipPhone,
    }));
  };

  const addBlankItem = () => {
    setItems((current) => [...current, createDraftItem()]);
  };

  const addProductItem = (product: AdminStoreProductListDto) => {
    setItems((current) => [...current, createDraftItem(product)]);
  };

  const updateItemText = (
    localId: string,
    field: "designId" | "productId" | "size",
    value: string,
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;

        if (field === "productId") {
          const nextProduct = value ? productById.get(Number(value)) : undefined;
          return {
            ...item,
            productId: value,
            unitPrice: nextProduct?.price ?? item.unitPrice,
          };
        }

        return { ...item, [field]: value };
      }),
    );
  };

  const updateItemNumber = (
    localId: string,
    field: "quantity" | "unitPrice",
    value: number,
  ) => {
    setItems((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;

        return {
          ...item,
          [field]: field === "quantity" ? Math.max(1, Math.trunc(value || 0)) : sanitizeMoney(value),
        };
      }),
    );
  };

  const removeItem = (localId: string) => {
    setItems((current) =>
      current.length > 1
        ? current.filter((item) => item.localId !== localId)
        : [createDraftItem()],
    );
  };

  const resetDraft = () => {
    setCreatedOrder(null);
    setError(null);
    setSelectedCustomer(null);
    setForm(emptyOrderForm);
    setItems([createDraftItem()]);
  };

  const submitOrder = async () => {
    const result = buildCreateOrderPayload(selectedCustomer, form, items);
    if (!result.payload) {
      setError(result.error);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await adminOrderApi.createOrder(result.payload);
      setCreatedOrder(created);
      setSelectedCustomer(null);
      setForm(emptyOrderForm);
      setItems([createDraftItem()]);
    } catch (err) {
      console.error("Failed to create admin order", err);
      setCreatedOrder(null);
      setError(getApiErrorMessage(err, "Không thể tạo đơn hàng mới."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminShell
      activePath="/admin/orders/new"
      searchPlaceholder="Tìm khách hàng, sản phẩm hoặc mã thiết kế..."
    >
      <section className="admin-orders-page admin-new-order-page">
        <div className="admin-dashboard__heading">
          <div>
            <p>Tạo đơn thủ công cho bộ phận vận hành</p>
            <h1 className="admin-page-title">Đơn hàng mới</h1>
          </div>
          <div className="admin-new-order-heading__actions">
            <a className="admin-detail-link" href="/admin/orders">
              Về danh sách đơn
            </a>
            <button
              className="admin-refresh-button"
              type="button"
              onClick={() => void reloadLookupData()}
              disabled={customersLoading || productsLoading}
            >
              {customersLoading || productsLoading ? "Đang tải..." : "Tải lại dữ liệu"}
            </button>
          </div>
        </div>

        {error ? <div className="admin-alert" role="alert">{error}</div> : null}
        {createdOrder ? (
          <div className="admin-success-alert" role="status">
            Đã tạo đơn hàng <strong>{createdOrder.orderCode}</strong> (#{createdOrder.orderId}).{" "}
            <a className="admin-detail-link" href="/admin/orders">
              Quay lại danh sách đơn hàng
            </a>
          </div>
        ) : null}

        <section className="admin-stat-grid" aria-label="Tóm tắt đơn hàng mới">
          <article className="admin-stat-card">
            <div>
              <p>Khách hàng đã chọn</p>
              <strong>{selectedCustomer ? selectedCustomer.fullName : "Chưa chọn"}</strong>
              <span>{selectedCustomer?.email ?? "Chọn user Customer để bắt đầu"}</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div>
              <p>Dòng sản phẩm</p>
              <strong>{items.length}</strong>
              <span>{items.filter((item) => item.productId).length} dòng đã gắn sản phẩm</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div>
              <p>Tạm tính</p>
              <strong>{formatCurrency(subtotal)}</strong>
              <span>Chưa gồm ship và giảm giá</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <div>
              <p>Tổng thanh toán</p>
              <strong>{formatCurrency(total)}</strong>
              <span>{form.paymentStatus} · {form.orderStatus}</span>
            </div>
          </article>
        </section>

        <div className="admin-orders-grid admin-products-grid admin-new-order-grid">
          <section className="admin-panel admin-orders-carousel">
            <div className="admin-new-order-section">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>1. Chọn khách hàng</h2>
                  <span>Đang tải tối đa 50 tài khoản Customer từ hệ thống.</span>
                </div>
              </div>

              <div className="admin-orders-controls admin-products-filters">
                <label>
                  Tìm khách hàng
                  <input
                    type="search"
                    value={customerQuery}
                    onChange={(event) => setCustomerQuery(event.target.value)}
                    placeholder="Email, họ tên hoặc số điện thoại..."
                  />
                </label>
              </div>

              {customersError ? (
                <div className="admin-alert" role="alert">{customersError}</div>
              ) : null}

              {selectedCustomer ? (
                <div className="admin-new-order-customer-focus">
                  <strong>{selectedCustomer.fullName}</strong>
                  <span>{selectedCustomer.email}</span>
                  <small>{selectedCustomer.phone ?? "Chưa có số điện thoại"}</small>
                </div>
              ) : null}

              {customersLoading ? (
                <div className="admin-empty-state">Đang tải danh sách khách hàng...</div>
              ) : shownCustomers.length > 0 ? (
                <div className="admin-new-order-picker">
                  {shownCustomers.map((customer) => {
                    const isSelected = selectedCustomer?.userId === customer.userId;

                    return (
                      <button
                        key={customer.userId}
                        className={`admin-new-order-card${isSelected ? " is-selected" : ""}`}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                      >
                        <strong>{customer.fullName}</strong>
                        <span>{customer.email}</span>
                        <small>{customer.phone ?? "Chưa cập nhật SĐT"}</small>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="admin-empty-state">Không tìm thấy khách hàng phù hợp.</div>
              )}
            </div>

            <div className="admin-new-order-section">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>2. Chọn sản phẩm</h2>
                  <span>Thêm nhanh từ catalog đang bán hoặc tạo dòng thủ công.</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={addBlankItem}>
                    Thêm dòng trống
                  </button>
                </div>
              </div>

              <div className="admin-orders-controls admin-products-filters">
                <label>
                  Tìm sản phẩm
                  <input
                    type="search"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Tên sản phẩm hoặc mã sản phẩm..."
                  />
                </label>
              </div>

              {productsError ? (
                <div className="admin-alert" role="alert">{productsError}</div>
              ) : null}

              {productsLoading ? (
                <div className="admin-empty-state">Đang tải catalog sản phẩm...</div>
              ) : shownProducts.length > 0 ? (
                <div className="admin-new-order-picker admin-new-order-picker--products">
                  {shownProducts.map((product) => (
                    <button
                      key={product.productId}
                      className="admin-new-order-card"
                      type="button"
                      onClick={() => addProductItem(product)}
                    >
                      <strong>{product.name}</strong>
                      <span>#{product.productId}</span>
                      <small>
                        {formatCurrency(product.price)} · {product.isCustomizable ? "Custom" : "Ready-made"}
                      </small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="admin-empty-state">Không tìm thấy sản phẩm đang bán phù hợp.</div>
              )}
            </div>

            <div className="admin-new-order-section">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>3. Cấu hình line items</h2>
                  <span>Mỗi dòng cần có sản phẩm hoặc design ID, size, số lượng và đơn giá.</span>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table admin-new-order-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Design ID</th>
                      <th>Size</th>
                      <th>SL</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const selectedProductName = item.productId
                        ? productById.get(Number(item.productId))?.name
                        : null;

                      return (
                        <tr key={item.localId}>
                          <td>
                            <select
                              value={item.productId}
                              onChange={(event) =>
                                updateItemText(item.localId, "productId", event.target.value)
                              }
                            >
                              <option value="">Chọn sản phẩm</option>
                              {products.map((product) => (
                                <option key={product.productId} value={product.productId}>
                                  #{product.productId} · {product.name}
                                </option>
                              ))}
                            </select>
                            <span>{selectedProductName ?? "Có thể để trống nếu dùng design ID"}</span>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.designId}
                              onChange={(event) =>
                                updateItemText(item.localId, "designId", event.target.value)
                              }
                              placeholder="Ví dụ: 1024"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              value={item.size}
                              onChange={(event) =>
                                updateItemText(item.localId, "size", event.target.value)
                              }
                              placeholder="S, M, L..."
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) =>
                                updateItemNumber(
                                  item.localId,
                                  "quantity",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={item.unitPrice}
                              onChange={(event) =>
                                updateItemNumber(
                                  item.localId,
                                  "unitPrice",
                                  Number(event.target.value),
                                )
                              }
                            />
                          </td>
                          <td>
                            <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button type="button" onClick={() => removeItem(item.localId)}>
                                Xoá dòng
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <aside className="admin-orders-side">
            <section className="admin-panel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>Thông tin giao hàng & thanh toán</h2>
                  <span>Payload tạo đơn gửi trực tiếp lên API admin orders.</span>
                </div>
              </div>

              <div className="admin-product-form admin-new-order-form">
                <label>
                  Người nhận
                  <input
                    type="text"
                    value={form.shipName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shipName: event.target.value }))
                    }
                    placeholder="Nguyễn Văn A"
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    type="tel"
                    value={form.shipPhone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shipPhone: event.target.value }))
                    }
                    placeholder="09xxxxxxxx"
                  />
                </label>
                <label className="admin-product-form__wide">
                  Địa chỉ giao hàng
                  <input
                    type="text"
                    value={form.shipAddress}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shipAddress: event.target.value }))
                    }
                    placeholder="Số nhà, đường, phường/xã..."
                  />
                </label>
                <label>
                  Tỉnh / Thành phố
                  <input
                    type="text"
                    value={form.shipProvince}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shipProvince: event.target.value }))
                    }
                    placeholder="Hồ Chí Minh"
                  />
                </label>
                <label>
                  Phương thức thanh toán
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentMethod: event.target.value }))
                    }
                  >
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trạng thái thanh toán
                  <select
                    value={form.paymentStatus}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentStatus: event.target.value }))
                    }
                  >
                    {paymentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trạng thái đơn hàng
                  <select
                    value={form.orderStatus}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, orderStatus: event.target.value }))
                    }
                  >
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Phí ship
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.shippingFee}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        shippingFee: sanitizeMoney(Number(event.target.value)),
                      }))
                    }
                  />
                </label>
                <label>
                  Giảm giá
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.discountAmount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discountAmount: sanitizeMoney(Number(event.target.value)),
                      }))
                    }
                  />
                </label>
                <label>
                  Voucher ID (tuỳ chọn)
                  <input
                    type="number"
                    min="1"
                    value={form.voucherId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, voucherId: event.target.value }))
                    }
                    placeholder="Nhập ID voucher nếu có"
                  />
                </label>
              </div>

              <div className="admin-order-detail admin-new-order-summary">
                <dl>
                  <div>
                    <dt>Khách hàng</dt>
                    <dd>{selectedCustomer?.email ?? "Chưa chọn"}</dd>
                  </div>
                  <div>
                    <dt>Tạm tính</dt>
                    <dd>{formatCurrency(subtotal)}</dd>
                  </div>
                  <div>
                    <dt>Phí ship</dt>
                    <dd>{formatCurrency(form.shippingFee)}</dd>
                  </div>
                  <div>
                    <dt>Giảm giá</dt>
                    <dd>{formatCurrency(form.discountAmount)}</dd>
                  </div>
                  <div>
                    <dt>Tổng cộng</dt>
                    <dd>{formatCurrency(total)}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-status-form admin-new-order-actions">
                <button type="button" onClick={() => void submitOrder()} disabled={submitting}>
                  {submitting ? "Đang tạo đơn..." : "Tạo đơn hàng"}
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={submitting}
                >
                  Làm mới biểu mẫu
                </button>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </AdminShell>
  );
}

export default AdminNewOrderPage;
