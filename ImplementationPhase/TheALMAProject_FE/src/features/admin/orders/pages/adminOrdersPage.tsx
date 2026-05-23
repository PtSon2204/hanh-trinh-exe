import { useCallback, useEffect, useMemo, useState } from "react";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminOrderApi } from "../api/adminOrderApi";
import type {
  AdminOrderDto,
  AdminOrderListDto,
  AdminOrderPrintFileDto,
  AdminOrderStatisticDto,
  AdminOrderStatisticQuery,
} from "../types/adminOrder";

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

const orderStatusOptions = [
  "Pending",
  "Processing",
  "Printing",
  "Shipping",
  "Delivered",
  "Completed",
  "Cancelled",
];

const paymentStatusOptions = ["Pending", "Paid", "Failed", "Refunded"];

type AdminOrdersPanel = "orders" | "statistics" | "printFiles";

const adminOrdersPanels: Array<{ id: AdminOrdersPanel; label: string }> = [
  { id: "orders", label: "Danh sách đơn hàng" },
  { id: "statistics", label: "Thống kê" },
  { id: "printFiles", label: "Artwork in đã xuất" },
];

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có ngày";
  return dateFormatter.format(new Date(value));
}

function getStatusTone(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("complete") ||
    normalized.includes("delivered") ||
    normalized.includes("paid")
  ) {
    return "success";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("fail") ||
    normalized.includes("refund")
  ) {
    return "danger";
  }

  if (
    normalized.includes("process") ||
    normalized.includes("ship") ||
    normalized.includes("print")
  ) {
    return "info";
  }

  return "warning";
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultStatisticQuery(): Required<
  Pick<AdminOrderStatisticQuery, "fromDate" | "groupBy" | "toDate">
> {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - 30);

  return {
    fromDate: toInputDate(fromDate),
    groupBy: "month",
    toDate: toInputDate(toDate),
  };
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<PagedResult<AdminOrderListDto> | null>(
    null,
  );
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDto | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [exportingOrderId, setExportingOrderId] = useState<number | null>(null);
  const [printFiles, setPrintFiles] = useState<AdminOrderPrintFileDto[]>([]);
  const [statistics, setStatistics] = useState<AdminOrderStatisticDto[]>([]);
  const [statisticsLoading, setStatisticsLoading] = useState(true);
  const [statisticsQuery, setStatisticsQuery] = useState(
    getDefaultStatisticQuery,
  );
  const [activePanel, setActivePanel] = useState<AdminOrdersPanel>("orders");
  const [statusDraft, setStatusDraft] = useState({
    orderStatus: "Processing",
    paymentStatus: "Paid",
  });

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminOrderApi.getOrders(pageNumber, pageSize);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load admin orders", err);
      setOrders(null);
      setError("Không thể tải danh sách đơn hàng admin.");
    } finally {
      setLoading(false);
    }
  }, [pageNumber, pageSize]);

  const loadStatistics = useCallback(async () => {
    try {
      setStatisticsLoading(true);
      const data = await adminOrderApi.getStatistics(statisticsQuery);
      setStatistics(data);
    } catch (err) {
      console.error("Failed to load admin order statistics", err);
      setStatistics([]);
    } finally {
      setStatisticsLoading(false);
    }
  }, [statisticsQuery]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const statisticsSummary = useMemo(() => {
    return statistics.reduce(
      (current, item) => ({
        itemCount: current.itemCount + item.itemCount,
        orderCount: current.orderCount + item.orderCount,
        totalRevenue: current.totalRevenue + item.totalRevenue,
      }),
      { itemCount: 0, orderCount: 0, totalRevenue: 0 },
    );
  }, [statistics]);

  const openOrderDetail = async (orderId: number) => {
    try {
      setDetailLoading(true);
      setActionError(null);
      setActionMessage(null);
      setPrintFiles([]);
      const detail = await adminOrderApi.getOrderById(orderId);
      setSelectedOrder(detail);
      setStatusDraft({
        orderStatus: detail.orderStatus,
        paymentStatus: detail.paymentStatus,
      });
    } catch (err) {
      console.error("Failed to load admin order detail", err);
      setActionError("Không thể tải chi tiết đơn hàng.");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateSelectedOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      setActionError(null);
      setActionMessage(null);
      const result = await adminOrderApi.updateStatus(selectedOrder.orderId, {
        orderStatus: statusDraft.orderStatus,
        paymentStatus: statusDraft.paymentStatus,
      });
      setActionMessage(result.message);
      await Promise.all([loadOrders(), openOrderDetail(selectedOrder.orderId)]);
    } catch (err) {
      console.error("Failed to update admin order status", err);
      setActionError("Không thể cập nhật trạng thái đơn hàng.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const exportSelectedOrderPrintFiles = async (orderId: number) => {
    try {
      setExportingOrderId(orderId);
      setActionError(null);
      setActionMessage(null);
      const files = await adminOrderApi.exportPrintFiles(orderId);
      setPrintFiles(files);
      setActionMessage("Đã xuất artwork thiết kế in cho đơn hàng.");
    } catch (err) {
      console.error("Failed to export admin order print files", err);
      setActionError("Không thể xuất artwork thiết kế in cho đơn hàng.");
    } finally {
      setExportingOrderId(null);
    }
  };

  return (
    <section className="admin-orders-page">
      <div className="admin-dashboard__heading">
        <div>
          <h1 style={{ margin: 0 }}>Quản lý đơn hàng</h1>
        </div>
        <button
          className="admin-refresh-button"
          type="button"
          onClick={() => void Promise.all([loadOrders(), loadStatistics()])}
          disabled={loading || statisticsLoading}
        >
          {loading || statisticsLoading ? "Đang tải..." : "Tải lại data"}
        </button>
      </div>

      {error ? (
        <div className="admin-alert" role="alert">
          {error}
        </div>
      ) : null}
      {actionError ? (
        <div className="admin-alert" role="alert">
          {actionError}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="admin-success-alert" role="status">
          {actionMessage}
        </div>
      ) : null}

      <section className="admin-stat-grid" aria-label="Thống kê đơn hàng">
        <article className="admin-stat-card">
          <div>
            <p>Tổng đơn trong bảng</p>
            <strong>
              {loading
                ? "Đang tải..."
                : (orders?.totalRecords ?? 0).toLocaleString("vi-VN")}
            </strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Đơn trong thống kê</p>
            <strong>
              {statisticsLoading
                ? "Đang tải..."
                : statisticsSummary.orderCount.toLocaleString("vi-VN")}
            </strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Sản phẩm trong đơn</p>
            <strong>
              {statisticsLoading
                ? "Đang tải..."
                : statisticsSummary.itemCount.toLocaleString("vi-VN")}
            </strong>
          </div>
        </article>
        <article className="admin-stat-card">
          <div>
            <p>Doanh thu thống kê</p>
            <strong>
              {statisticsLoading
                ? "Đang tải..."
                : formatCurrency(statisticsSummary.totalRevenue)}
            </strong>
          </div>
        </article>
      </section>

      <div className="admin-orders-grid">
        <section className="admin-panel admin-orders-carousel">
          <div
            className="admin-carousel-tabs"
            role="tablist"
            aria-label="Quản lý đơn hàng"
          >
            {adminOrdersPanels.map((panel) => (
              <button
                key={panel.id}
                className={`admin-carousel-tab${activePanel === panel.id ? " is-active" : ""}`}
                type="button"
                onClick={() => setActivePanel(panel.id)}
                role="tab"
                aria-selected={activePanel === panel.id}
              >
                {panel.label}
              </button>
            ))}
          </div>

          {activePanel === "orders" ? (
            <div className="admin-carousel-panel" role="tabpanel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>Danh sách đơn hàng</h2>
                  <span>
                    Trang {orders?.pageNumber ?? pageNumber} /{" "}
                    {orders?.totalPages ?? 1}
                  </span>
                </div>
                <div className="admin-orders-controls">
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
              </div>

              {loading ? (
                <div className="admin-empty-state">
                  Đang tải đơn hàng admin...
                </div>
              ) : orders && orders.data.length > 0 ? (
                <div className="admin-table-wrap">
                  <table className="admin-table admin-orders-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày tạo</th>
                        <th>Tổng tiền</th>
                        <th>Đơn hàng</th>
                        <th>Thanh toán</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.data.map((order) => (
                        <tr key={order.orderId}>
                          <td>
                            <strong>{order.orderCode}</strong>
                            <span>#{order.orderId}</span>
                          </td>
                          <td>{order.userEmail}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <strong>{formatCurrency(order.totalAmount)}</strong>
                            <span>{order.paymentMethod}</span>
                          </td>
                          <td>
                            <span
                              className={`admin-status admin-status--${getStatusTone(order.orderStatus)}`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`admin-status admin-status--${getStatusTone(order.paymentStatus)}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <div className="admin-row-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  void openOrderDetail(order.orderId)
                                }
                              >
                                Chi tiết
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void exportSelectedOrderPrintFiles(
                                    order.orderId,
                                  )
                                }
                                disabled={exportingOrderId === order.orderId}
                              >
                                {exportingOrderId === order.orderId
                                  ? "Đang xuất..."
                                  : "Xuất artwork"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty-state">Chưa có đơn hàng.</div>
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
                      orders
                        ? Math.min(orders.totalPages || 1, current + 1)
                        : current + 1,
                    )
                  }
                  disabled={
                    loading ||
                    (!!orders?.totalPages && pageNumber >= orders.totalPages)
                  }
                >
                  Trang sau
                </button>
              </div>
            </div>
          ) : null}

          {activePanel === "statistics" ? (
            <div className="admin-carousel-panel" role="tabpanel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>Thống kê</h2>
                  <span>Theo khoảng thời gian và nhóm dữ liệu</span>
                </div>
              </div>
              <div className="admin-status-form">
                <label>
                  Từ ngày
                  <input
                    type="date"
                    value={statisticsQuery.fromDate}
                    onChange={(event) =>
                      setStatisticsQuery((current) => ({
                        ...current,
                        fromDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Đến ngày
                  <input
                    type="date"
                    value={statisticsQuery.toDate}
                    onChange={(event) =>
                      setStatisticsQuery((current) => ({
                        ...current,
                        toDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Nhóm
                  <select
                    value={statisticsQuery.groupBy}
                    onChange={(event) =>
                      setStatisticsQuery((current) => ({
                        ...current,
                        groupBy: event.target.value as "day" | "week" | "month",
                      }))
                    }
                  >
                    <option value="day">day</option>
                    <option value="week">week</option>
                    <option value="month">month</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void loadStatistics()}
                  disabled={statisticsLoading}
                >
                  {statisticsLoading ? "Đang tải..." : "Gọi statistics"}
                </button>
              </div>
              {statistics.length > 0 ? (
                <ul className="admin-stat-list admin-stat-list--wide">
                  {statistics.map((item) => (
                    <li key={item.period}>
                      <span>{item.period}</span>
                      <strong>{formatCurrency(item.totalRevenue)}</strong>
                      <small>
                        {item.orderCount} đơn / {item.itemCount} sản phẩm
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty-state">
                  {statisticsLoading
                    ? "Đang tải thống kê..."
                    : "Chưa có thống kê."}
                </div>
              )}
            </div>
          ) : null}

          {activePanel === "printFiles" ? (
            <div className="admin-carousel-panel" role="tabpanel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>Artwork thiết kế in đã xuất</h2>
                  <span>PNG thiết kế custom dùng cho sản xuất, không phải hoá đơn/PDF</span>
                </div>
              </div>
              {printFiles.length > 0 ? (
                <ul className="admin-print-files">
                  {printFiles.map((file) => (
                    <li key={file.orderItemId}>
                      <div>
                        <strong>{file.designName ?? file.orderCode}</strong>
                        <span>
                          Size {file.size} · SL {file.quantity}
                        </span>
                      </div>
                      <a
                        href={adminOrderApi.resolvePrintFileUrl(
                          file.printFileUrl,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở PNG
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty-state">
                  Chọn một đơn hàng rồi bấm Xuất artwork để hiển thị PNG thiết kế in.
                </div>
              )}
            </div>
          ) : null}
        </section>

        <aside className="admin-orders-side">
          <section className="admin-panel">
            <h2>Chi tiết & cập nhật</h2>
            {detailLoading ? (
              <div className="admin-empty-state">Đang tải chi tiết...</div>
            ) : selectedOrder ? (
              <div className="admin-order-detail">
                <div>
                  <strong style={{ gridColumn: 1 }}>
                    {selectedOrder.orderCode}
                  </strong>
                  <span style={{ gridColumn: 2, textAlign: "right" }}>
                    {selectedOrder.userEmail}
                  </span>
                </div>
                <dl>
                  <div>
                    <dt>Người nhận</dt>
                    <dd>{selectedOrder.shipName}</dd>
                  </div>
                  <div>
                    <dt>SĐT</dt>
                    <dd>{selectedOrder.shipPhone}</dd>
                  </div>
                  <div>
                    <dt>Địa chỉ</dt>
                    <dd>{selectedOrder.shipAddress}</dd>
                  </div>
                  <div>
                    <dt>Tỉnh/TP</dt>
                    <dd>{selectedOrder.shipProvince}</dd>
                  </div>
                  <div>
                    <dt>Tạm tính</dt>
                    <dd>
                      {formatCurrency(
                        selectedOrder.totalAmount -
                          selectedOrder.shippingFee +
                          selectedOrder.discountAmount,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Phí ship</dt>
                    <dd>{formatCurrency(selectedOrder.shippingFee)}</dd>
                  </div>
                  <div>
                    <dt>Giảm giá</dt>
                    <dd>{formatCurrency(selectedOrder.discountAmount)}</dd>
                  </div>
                  <div>
                    <dt>Tổng</dt>
                    <dd>{formatCurrency(selectedOrder.totalAmount)}</dd>
                  </div>
                </dl>

                <div className="admin-status-form">
                  <label>
                    Trạng thái đơn
                    <select
                      value={statusDraft.orderStatus}
                      onChange={(event) =>
                        setStatusDraft((current) => ({
                          ...current,
                          orderStatus: event.target.value,
                        }))
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
                    Thanh toán
                    <select
                      value={statusDraft.paymentStatus}
                      onChange={(event) =>
                        setStatusDraft((current) => ({
                          ...current,
                          paymentStatus: event.target.value,
                        }))
                      }
                    >
                      {paymentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => void updateSelectedOrderStatus()}
                    disabled={updatingStatus}
                  >
                    {updatingStatus
                      ? "Đang cập nhật..."
                      : "Cập nhật trạng thái"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void exportSelectedOrderPrintFiles(selectedOrder.orderId)
                    }
                    disabled={exportingOrderId === selectedOrder.orderId}
                  >
                    {exportingOrderId === selectedOrder.orderId
                      ? "Đang xuất..."
                      : "Xuất artwork in"}
                  </button>
                </div>

                <h3>Sản phẩm trong đơn</h3>
                <ul className="admin-order-items">
                  {selectedOrder.items.map((item) => (
                    <li key={item.orderItemId}>
                      <span>{item.itemName}</span>
                      <strong>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </strong>
                      <small>Size {item.size}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="admin-empty-state">
                Chọn một đơn hàng để xem chi tiết và cập nhật trạng thái.
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}

export default AdminOrdersPage;
