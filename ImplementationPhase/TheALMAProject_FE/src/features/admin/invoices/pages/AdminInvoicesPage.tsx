import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminInvoiceApi } from "../api/adminInvoiceApi";
import type {
  AdminInvoiceDto,
  AdminInvoiceListDto,
  AdminInvoiceQuery,
} from "../types/adminInvoice";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const invoiceStatusOptions = ["Issued", "Paid", "Cancelled", "Refunded"];

function emptyPage<T>(pageNumber: number, pageSize: number): PagedResult<T> {
  return {
    data: [],
    pageNumber,
    pageSize,
    totalPages: 1,
    totalRecords: 0,
  };
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có ngày";
  return dateFormatter.format(new Date(value));
}

function getStatusTone(status: string | null) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("paid") || normalized.includes("issued")) return "success";
  if (normalized.includes("cancel") || normalized.includes("refund")) return "danger";
  return "warning";
}

function toNumberFilter(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const numericValue = Number(trimmed);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

export function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<PagedResult<AdminInvoiceListDto> | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoiceDto | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [orderIdFilter, setOrderIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [minAmountFilter, setMinAmountFilter] = useState("");
  const [maxAmountFilter, setMaxAmountFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const query: AdminInvoiceQuery = useMemo(
    () => ({
      fromDate: fromDateFilter || undefined,
      invoiceNumber: invoiceNumberFilter.trim() || undefined,
      maxAmount: toNumberFilter(maxAmountFilter),
      minAmount: toNumberFilter(minAmountFilter),
      orderId: toNumberFilter(orderIdFilter),
      pageNumber,
      pageSize,
      status: statusFilter === "all" ? undefined : statusFilter,
      toDate: toDateFilter || undefined,
      userId: toNumberFilter(userIdFilter),
    }),
    [
      fromDateFilter,
      invoiceNumberFilter,
      maxAmountFilter,
      minAmountFilter,
      orderIdFilter,
      pageNumber,
      pageSize,
      statusFilter,
      toDateFilter,
      userIdFilter,
    ],
  );

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminInvoiceApi.getInvoices(query);
      setInvoices(result);
    } catch (err) {
      console.error("Failed to load admin invoices", err);
      setInvoices(emptyPage(query.pageNumber ?? 1, query.pageSize ?? 10));
      setError(getApiErrorMessage(err, "Không thể tải danh sách hóa đơn."));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  const openInvoice = async (id: number) => {
    try {
      setDetailLoading(true);
      setError(null);
      setMessage(null);
      const detail = await adminInvoiceApi.getInvoiceById(id);
      setSelectedInvoice(detail);
    } catch (err) {
      console.error("Failed to load admin invoice detail", err);
      setError(getApiErrorMessage(err, "Không thể tải chi tiết hóa đơn."));
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadInvoice = async (invoice: AdminInvoiceListDto | AdminInvoiceDto) => {
    try {
      setMessage(null);
      setError(null);
      await adminInvoiceApi.downloadInvoice(invoice.invoiceId, invoice.invoiceNumber);
      setMessage(`Đã tải hóa đơn ${invoice.invoiceNumber}.`);
    } catch (err) {
      console.error("Failed to download invoice", err);
      setError(getApiErrorMessage(err, "Không thể tải file PDF hóa đơn."));
    }
  };

  const exportInvoices = async () => {
    try {
      setExporting(true);
      setMessage(null);
      setError(null);
      await adminInvoiceApi.exportInvoices(query);
      setMessage("Đã xuất file CSV hóa đơn theo bộ lọc hiện tại.");
    } catch (err) {
      console.error("Failed to export invoices", err);
      setError(getApiErrorMessage(err, "Không thể xuất file hóa đơn."));
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setPageNumber(1);
    setInvoiceNumberFilter("");
    setOrderIdFilter("");
    setUserIdFilter("");
    setStatusFilter("all");
    setFromDateFilter("");
    setToDateFilter("");
    setMinAmountFilter("");
    setMaxAmountFilter("");
  };

  const currentPageTotal = invoices?.data.reduce((total, invoice) => total + invoice.totalAmount, 0) ?? 0;

  return (
    <section className="admin-orders-page admin-products-page admin-invoices-page">
      <div className="admin-dashboard__heading">
        <div>
          <p>Quản lý hóa đơn</p>
          <h1 className="admin-page-title">Hóa đơn</h1>
        </div>
        <div className="admin-row-actions">
          <button
            className="admin-refresh-button"
            type="button"
            onClick={() => void exportInvoices()}
            disabled={exporting || loading}
          >
            {exporting ? "Đang xuất..." : "Xuất CSV"}
          </button>
          <button
            className="admin-refresh-button"
            type="button"
            onClick={() => void loadInvoices()}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Tải lại data"}
          </button>
        </div>
      </div>

      {error ? <div className="admin-alert" role="alert">{error}</div> : null}
      {message ? <div className="admin-success-alert" role="status">{message}</div> : null}

      <section className="admin-stat-grid" aria-label="Tổng quan hóa đơn">
        <article className="admin-stat-card">
          <div>
            <p>Tổng hóa đơn</p>
            <strong>{invoices?.totalRecords ?? 0}</strong>
            <span>Theo bộ lọc hiện tại</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Giá trị trang hiện tại</p>
            <strong>{formatCurrency(currentPageTotal)}</strong>
            <span>{invoices?.data.length ?? 0} hóa đơn đang hiển thị</span>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Trang</p>
            <strong>{invoices?.pageNumber ?? pageNumber}/{invoices?.totalPages ?? 1}</strong>
            <span>Page size {pageSize}</span>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid admin-products-grid admin-users-grid">
        <section className="admin-panel admin-orders-carousel">
          <div className="admin-panel__header admin-orders-toolbar">
            <div>
              <h2>Danh sách hóa đơn</h2>
              <span>Tra cứu, tải PDF và xuất CSV theo bộ lọc.</span>
            </div>
            <button className="admin-refresh-button" type="button" onClick={resetFilters}>
              Xóa bộ lọc
            </button>
          </div>

          <div className="admin-orders-controls admin-products-filters">
            <label>
              Mã hóa đơn
              <input
                type="search"
                value={invoiceNumberFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setInvoiceNumberFilter(event.target.value);
                }}
                placeholder="INV-..."
              />
            </label>
            <label>
              Order ID
              <input
                inputMode="numeric"
                value={orderIdFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setOrderIdFilter(event.target.value);
                }}
                placeholder="VD: 1001"
              />
            </label>
            <label>
              User ID
              <input
                inputMode="numeric"
                value={userIdFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setUserIdFilter(event.target.value);
                }}
                placeholder="VD: 12"
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
                {invoiceStatusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Từ ngày
              <input
                type="date"
                value={fromDateFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setFromDateFilter(event.target.value);
                }}
              />
            </label>
            <label>
              Đến ngày
              <input
                type="date"
                value={toDateFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setToDateFilter(event.target.value);
                }}
              />
            </label>
            <label>
              Từ tiền
              <input
                inputMode="decimal"
                value={minAmountFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setMinAmountFilter(event.target.value);
                }}
                placeholder="0"
              />
            </label>
            <label>
              Đến tiền
              <input
                inputMode="decimal"
                value={maxAmountFilter}
                onChange={(event) => {
                  setPageNumber(1);
                  setMaxAmountFilter(event.target.value);
                }}
                placeholder="500000"
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
            <div className="admin-empty-state">Đang tải danh sách hóa đơn...</div>
          ) : invoices && invoices.data.length > 0 ? (
            <div className="admin-table-wrap">
              <table className="admin-table admin-invoices-table">
                <thead>
                  <tr>
                    <th>Hóa đơn</th>
                    <th>Khách hàng</th>
                    <th>Ngày phát hành</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.data.map((invoice) => (
                    <tr key={invoice.invoiceId}>
                      <td>
                        <strong>{invoice.invoiceNumber}</strong>
                        <span>Order #{invoice.orderId} · {invoice.orderCode ?? "Chưa có mã"}</span>
                      </td>
                      <td>
                        <strong>{invoice.billingName}</strong>
                        <span>User #{invoice.userId} · {invoice.userEmail ?? "Chưa có email"}</span>
                      </td>
                      <td>{formatDate(invoice.issueDate)}</td>
                      <td>
                        <strong>{formatCurrency(invoice.totalAmount)}</strong>
                        <span>{invoice.currencyCode}</span>
                      </td>
                      <td>
                        <span className={`admin-status admin-status--${getStatusTone(invoice.invoiceStatus)}`}>
                          {invoice.invoiceStatus}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" onClick={() => void openInvoice(invoice.invoiceId)}>
                            Chi tiết
                          </button>
                          <button type="button" onClick={() => void downloadInvoice(invoice)}>
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-empty-state">Không có hóa đơn phù hợp.</div>
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
                  invoices ? Math.min(invoices.totalPages || 1, current + 1) : current + 1,
                )
              }
              disabled={loading || (!!invoices?.totalPages && pageNumber >= invoices.totalPages)}
            >
              Trang sau
            </button>
          </div>
        </section>

        <aside className="admin-orders-side">
          <section className="admin-panel">
            <h2>Chi tiết hóa đơn</h2>
            {detailLoading ? <div className="admin-empty-state">Đang tải chi tiết...</div> : null}
            {!detailLoading && selectedInvoice ? (
              <div className="admin-user-detail">
                <dl>
                  <div>
                    <dt>Mã hóa đơn</dt>
                    <dd>{selectedInvoice.invoiceNumber}</dd>
                  </div>
                  <div>
                    <dt>Đơn hàng</dt>
                    <dd>#{selectedInvoice.orderId} · {selectedInvoice.orderCode ?? "Chưa có mã"}</dd>
                  </div>
                  <div>
                    <dt>Khách hàng</dt>
                    <dd>{selectedInvoice.userFullName ?? selectedInvoice.billingName}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{selectedInvoice.buyerEmail ?? selectedInvoice.userEmail ?? "Chưa có email"}</dd>
                  </div>
                  <div>
                    <dt>Điện thoại</dt>
                    <dd>{selectedInvoice.buyerPhone ?? "Chưa có SĐT"}</dd>
                  </div>
                  <div>
                    <dt>Địa chỉ</dt>
                    <dd>{selectedInvoice.billingAddress}</dd>
                  </div>
                  <div>
                    <dt>Thanh toán</dt>
                    <dd>{selectedInvoice.paymentMethod ?? "N/A"} · {selectedInvoice.paymentStatus ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt>Trạng thái đơn</dt>
                    <dd>{selectedInvoice.orderStatus ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt>Tạm tính</dt>
                    <dd>{formatCurrency(selectedInvoice.subTotal)}</dd>
                  </div>
                  <div>
                    <dt>Giảm giá</dt>
                    <dd>{formatCurrency(selectedInvoice.voucherDiscountAmount)}</dd>
                  </div>
                  <div>
                    <dt>Phí ship</dt>
                    <dd>{formatCurrency(selectedInvoice.shippingFee)}</dd>
                  </div>
                  <div>
                    <dt>Tổng cộng</dt>
                    <dd>{formatCurrency(selectedInvoice.totalAmount)}</dd>
                  </div>
                </dl>

                <div className="admin-status-form">
                  <button type="button" onClick={() => void downloadInvoice(selectedInvoice)}>
                    Tải PDF hóa đơn
                  </button>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table admin-invoice-items-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SL</th>
                        <th>Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.items.map((item) => (
                        <tr key={item.orderItemId}>
                          <td>
                            <strong>{item.itemName}</strong>
                            <span>{item.size} · {item.designId ? `Design #${item.designId}` : `Product #${item.productId ?? "N/A"}`}</span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {!detailLoading && !selectedInvoice ? (
              <div className="admin-empty-state">Chọn một hóa đơn để xem chi tiết.</div>
            ) : null}
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AdminInvoicesPage;
