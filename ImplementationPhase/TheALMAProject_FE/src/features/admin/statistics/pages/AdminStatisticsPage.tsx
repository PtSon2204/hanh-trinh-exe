import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../../../shared/api/axiosClient";
import { AdminShell } from "../../components/AdminShell";
import { adminInvoiceApi } from "../../invoices/api/adminInvoiceApi";
import type {
  AdminFinancialReportDto,
  AdminFinancialReportQuery,
} from "../../invoices/types/adminInvoice";
import { adminOrderApi } from "../../orders/api/adminOrderApi";
import type {
  AdminOperationStatisticsDto,
  AdminOrderStatisticDto,
  AdminOrderStatisticQuery,
  AdminProductStatisticsDto,
} from "../../orders/types/adminOrder";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  currency: "VND",
  maximumFractionDigits: 0,
  style: "currency",
});

const orderStatusOptions = [
  { label: "Chờ xử lý", value: "Pending" },
  { label: "Đang xử lý", value: "Processing" },
  { label: "Đang in", value: "Printing" },
  { label: "Đang giao", value: "Shipping" },
  { label: "Đã giao", value: "Delivered" },
  { label: "Hoàn tất", value: "Completed" },
  { label: "Đã hủy", value: "Cancelled" },
];

const paymentStatusOptions = [
  { label: "Chờ thanh toán", value: "Pending" },
  { label: "Đã thanh toán", value: "Paid" },
  { label: "Thanh toán lỗi", value: "Failed" },
  { label: "Đã hoàn tiền", value: "Refunded" },
];

const statusLabelByValue = new Map(
  [...orderStatusOptions, ...paymentStatusOptions, { label: "Tất cả", value: "all" }].map(
    (option) => [option.value, option.label],
  ),
);

type StatisticsTab = "overview" | "reconciliation" | "operations" | "products";

const statisticsTabs: { id: StatisticsTab; label: string; description: string }[] = [
  {
    id: "overview",
    label: "Tổng quan",
    description: "Doanh thu, đơn hàng và xu hướng trong kỳ.",
  },
  {
    id: "reconciliation",
    label: "Đối soát",
    description: "Doanh thu đơn hàng so với doanh thu hóa đơn.",
  },
  {
    id: "operations",
    label: "Vận hành",
    description: "Trạng thái đơn, tuổi xử lý và ngoại lệ vận hành.",
  },
  {
    id: "products",
    label: "Sản phẩm & tùy chỉnh",
    description: "Sản lượng hiện có; sản phẩm bán chạy bổ sung sau.",
  },
];

type StatisticsFilterState = {
  currencyCode: string;
  fromDate: string;
  groupBy: "day" | "week" | "month";
  orderStatus: string;
  paymentStatus: string;
  toDate: string;
};

type CombinedStatisticsPoint = {
  invoiceCount: number;
  itemCount: number;
  orderCount: number;
  period: string;
  totalDiscount: number;
  totalRevenue: number;
  totalShippingFee: number;
  totalSubTotal: number;
};

type ChartPoint = {
  barHeight: number;
  barX: number;
  barY: number;
  item: CombinedStatisticsPoint;
  labelX: number;
  linePoint: string;
};

const emptyOperationStatistics: AdminOperationStatisticsDto = {
  agingBuckets: [],
  customItemsNeedingExport: 0,
  exceptions: [],
  orderStatusBreakdown: [],
  ordersNeedingProduction: 0,
  ordersNeedingShipping: 0,
  paymentStatusBreakdown: [],
  totalItems: 0,
  totalOrders: 0,
  totalRevenue: 0,
};

const emptyProductStatistics: AdminProductStatisticsDto = {
  customItemCount: 0,
  customRevenue: 0,
  customizationTrend: [],
  readyMadeItemCount: 0,
  readyMadeRevenue: 0,
  topBaseProducts: [],
  topStoreProducts: [],
  topUniversities: [],
  totalItemsSold: 0,
  totalOrders: 0,
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatPercent(value: number) {
  return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`;
}

function safeDivide(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

function getAgingBucketTone(label: string, count: number) {
  if (count <= 0) return "neutral";
  if (label.includes("Trên 7")) return "danger";
  if (label.includes("4-7")) return "warning";
  return "info";
}

function getExceptionAction(label: string, severity: string) {
  if (severity === "danger") return "Cần xử lý ngay";
  if (severity === "warning") return "Cần kiểm tra trong ngày";
  if (label.includes("thiếu file in")) return "Theo dõi file sản xuất";
  return "Không cần hành động ngay";
}

function getDefaultFilters(): StatisticsFilterState {
  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - 29);

  return {
    currencyCode: "VND",
    fromDate: toInputDate(fromDate),
    groupBy: "week",
    orderStatus: "all",
    paymentStatus: "all",
    toDate: toInputDate(toDate),
  };
}

function toOrderStatisticQuery(filters: StatisticsFilterState): AdminOrderStatisticQuery {
  return {
    fromDate: filters.fromDate,
    groupBy: filters.groupBy,
    orderStatus: filters.orderStatus === "all" ? undefined : filters.orderStatus,
    paymentStatus:
      filters.paymentStatus === "all" ? undefined : filters.paymentStatus,
    toDate: filters.toDate,
  };
}

function toFinancialQuery(filters: StatisticsFilterState): AdminFinancialReportQuery {
  return {
    currencyCode: filters.currencyCode,
    fromDate: filters.fromDate,
    groupBy: filters.groupBy,
    toDate: filters.toDate,
  };
}

function getPeakPeriod(series: CombinedStatisticsPoint[]) {
  if (series.length === 0) return null;

  return series.reduce((best, current) =>
    current.totalRevenue > best.totalRevenue ? current : best,
  );
}

export function AdminStatisticsPage() {
  const [activeTab, setActiveTab] = useState<StatisticsTab>("overview");
  const [filters, setFilters] = useState<StatisticsFilterState>(getDefaultFilters);
  const [financialReport, setFinancialReport] = useState<AdminFinancialReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [operationStatistics, setOperationStatistics] = useState<AdminOperationStatisticsDto>(emptyOperationStatistics);
  const [orderStatistics, setOrderStatistics] = useState<AdminOrderStatisticDto[]>([]);
  const [productStatistics, setProductStatistics] = useState<AdminProductStatisticsDto>(emptyProductStatistics);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [orders, financials, operations, products] = await Promise.all([
        adminOrderApi.getStatistics(toOrderStatisticQuery(filters)),
        adminInvoiceApi.getFinancialReport(toFinancialQuery(filters)),
        adminOrderApi.getOperationStatistics(toOrderStatisticQuery(filters)),
        adminOrderApi.getProductStatistics(toOrderStatisticQuery(filters)),
      ]);

      setOrderStatistics(orders);
      setFinancialReport(financials);
      setOperationStatistics(operations);
      setProductStatistics(products);
    } catch (err) {
      console.error("Failed to load admin statistics page", err);
      setOrderStatistics([]);
      setFinancialReport([]);
      setOperationStatistics(emptyOperationStatistics);
      setProductStatistics(emptyProductStatistics);
      setError(getApiErrorMessage(err, "Không thể tải dữ liệu thống kê admin."));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const orderSummary = useMemo(
    () =>
      orderStatistics.reduce(
        (total, item) => ({
          itemCount: total.itemCount + item.itemCount,
          orderCount: total.orderCount + item.orderCount,
          totalDiscount: total.totalDiscount + item.totalDiscount,
          totalRevenue: total.totalRevenue + item.totalRevenue,
          totalShippingFee: total.totalShippingFee + item.totalShippingFee,
          totalSubTotal: total.totalSubTotal + item.totalSubTotal,
        }),
        {
          itemCount: 0,
          orderCount: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          totalShippingFee: 0,
          totalSubTotal: 0,
        },
      ),
    [orderStatistics],
  );

  const financialSummary = useMemo(
    () =>
      financialReport.reduce(
        (total, item) => ({
          invoiceCount: total.invoiceCount + item.invoiceCount,
          totalDiscount: total.totalDiscount + item.totalDiscount,
          totalRevenue: total.totalRevenue + item.totalRevenue,
          totalShippingFee: total.totalShippingFee + item.totalShippingFee,
          totalSubTotal: total.totalSubTotal + item.totalSubTotal,
        }),
        {
          invoiceCount: 0,
          totalDiscount: 0,
          totalRevenue: 0,
          totalShippingFee: 0,
          totalSubTotal: 0,
        },
      ),
    [financialReport],
  );

  const combinedSeries = useMemo(() => {
    const map = new Map<string, CombinedStatisticsPoint>();

    orderStatistics.forEach((item) => {
      map.set(item.period, {
        invoiceCount: 0,
        itemCount: item.itemCount,
        orderCount: item.orderCount,
        period: item.period,
        totalDiscount: item.totalDiscount,
        totalRevenue: item.totalRevenue,
        totalShippingFee: item.totalShippingFee,
        totalSubTotal: item.totalSubTotal,
      });
    });

    financialReport.forEach((item) => {
      const current = map.get(item.period);

      map.set(item.period, {
        invoiceCount: item.invoiceCount,
        itemCount: current?.itemCount ?? 0,
        orderCount: current?.orderCount ?? 0,
        period: item.period,
        totalDiscount: item.totalDiscount,
        totalRevenue: item.totalRevenue,
        totalShippingFee: item.totalShippingFee,
        totalSubTotal: item.totalSubTotal,
      });
    });

    return Array.from(map.values()).sort((left, right) =>
      left.period.localeCompare(right.period),
    );
  }, [financialReport, orderStatistics]);

  const chart = useMemo(() => {
    const width = 760;
    const height = 220;
    const left = 48;
    const right = 24;
    const top = 26;
    const bottom = 44;
    const chartHeight = height - top - bottom;
    const chartWidth = width - left - right;
    const revenueMax = Math.max(...combinedSeries.map((item) => item.totalRevenue), 0);
    const invoiceMax = Math.max(...combinedSeries.map((item) => item.invoiceCount), 0);
    const slot = combinedSeries.length > 0 ? chartWidth / combinedSeries.length : 0;
    const barWidth = Math.min(44, Math.max(18, slot * 0.46));
    const points: ChartPoint[] = combinedSeries.map((item, index) => {
      const labelX = left + slot * index + slot / 2;
      const revenueRatio = revenueMax > 0 ? item.totalRevenue / revenueMax : 0;
      const invoiceRatio = invoiceMax > 0 ? item.invoiceCount / invoiceMax : 0;
      const barHeight = revenueRatio > 0 ? Math.max(4, revenueRatio * chartHeight) : 0;
      const barX = labelX - barWidth / 2;
      const barY = top + chartHeight - barHeight;
      const lineY = top + chartHeight - invoiceRatio * chartHeight;

      return {
        barHeight,
        barX,
        barY,
        item,
        labelX,
        linePoint: `${labelX},${lineY}`,
      };
    });

    return {
      axisBottom: top + chartHeight,
      barWidth,
      height,
      linePoints: points.map((point) => point.linePoint).join(" "),
      points,
      width,
    };
  }, [combinedSeries]);

  const peakPeriod = getPeakPeriod(combinedSeries);
  const averageOrderValue = safeDivide(orderSummary.totalRevenue, orderSummary.orderCount);
  const averageInvoiceValue = safeDivide(financialSummary.totalRevenue, financialSummary.invoiceCount);
  const unitsPerOrder = safeDivide(orderSummary.itemCount, orderSummary.orderCount);
  const discountRate = safeDivide(financialSummary.totalDiscount, financialSummary.totalSubTotal) * 100;
  const invoiceCoverageRate = safeDivide(financialSummary.invoiceCount, orderSummary.orderCount) * 100;
  const uninvoicedOrderCount = Math.max(0, orderSummary.orderCount - financialSummary.invoiceCount);
  const orderToInvoiceRevenueGap = orderSummary.totalRevenue - financialSummary.totalRevenue;

  const businessRecommendation = useMemo(() => {
    if (orderSummary.orderCount === 0) {
      return "Chưa có đủ đơn hàng trong kỳ để đưa ra khuyến nghị kinh doanh.";
    }

    if (uninvoicedOrderCount > 0) {
      return "Có đơn đã ghi nhận trong order statistics nhưng chưa xuất hiện ở financial report. Cần kiểm tra quy trình xuất hóa đơn trước khi chốt doanh thu.";
    }

    if (discountRate > 20) {
      return "Tỷ lệ giảm giá đang cao. Nên rà soát voucher/campaign để bảo vệ biên lợi nhuận.";
    }

    if (unitsPerOrder < 1.5) {
      return "Số sản phẩm mỗi đơn còn thấp. Có thể thử bundle áo + phụ kiện hoặc gợi ý mua kèm để tăng basket size.";
    }

    return "Chỉ số trong kỳ ổn định. Có thể dùng kỳ doanh thu cao nhất để phân tích sản phẩm/campaign đang kéo tăng trưởng.";
  }, [discountRate, orderSummary.orderCount, uninvoicedOrderCount, unitsPerOrder]);

  return (
    <AdminShell
      activePath="/admin/statistics"
      searchPlaceholder="Tìm mốc doanh thu, trạng thái hoặc kỳ thống kê..."
    >
      <section className="admin-orders-page admin-statistics-page">
        <div className="admin-dashboard__heading">
          <div>
            <p>Snapshot đơn hàng và tài chính theo thời gian</p>
            <h1 className="admin-page-title">Thống kê admin</h1>
          </div>
          <button
            className="admin-refresh-button"
            type="button"
            onClick={() => void loadStatistics()}
            disabled={loading}
          >
            {loading ? "Đang tải..." : "Tải lại dữ liệu"}
          </button>
        </div>

        {error ? <div className="admin-alert" role="alert">{error}</div> : null}

        <div className="admin-status-form admin-statistics-filters">
          <label>
            Từ ngày
            <input
              type="date"
              value={filters.fromDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, fromDate: event.target.value }))
              }
            />
          </label>
          <label>
            Đến ngày
            <input
              type="date"
              value={filters.toDate}
              onChange={(event) =>
                setFilters((current) => ({ ...current, toDate: event.target.value }))
              }
            />
          </label>
          <label>
            Nhóm dữ liệu
            <select
              value={filters.groupBy}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  groupBy: event.target.value as "day" | "week" | "month",
                }))
              }
            >
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
            </select>
          </label>
          <label>
            Trạng thái đơn
            <select
              value={filters.orderStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, orderStatus: event.target.value }))
              }
            >
              <option value="all">Tất cả</option>
              {orderStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Trạng thái thanh toán
            <select
              value={filters.paymentStatus}
              onChange={(event) =>
                setFilters((current) => ({ ...current, paymentStatus: event.target.value }))
              }
            >
              <option value="all">Tất cả</option>
              {paymentStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mã tiền tệ
            <input
              type="text"
              value={filters.currencyCode}
              onChange={(event) =>
                setFilters((current) => ({ ...current, currencyCode: event.target.value.toUpperCase() }))
              }
              placeholder="VND"
            />
          </label>
        </div>

        <nav className="admin-statistics-tabs" aria-label="Các nhóm thống kê">
          {statisticsTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`admin-statistics-tab${activeTab === tab.id ? " is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <strong>{tab.label}</strong>
              <span>{tab.description}</span>
            </button>
          ))}
        </nav>

        {activeTab === "overview" ? (
          <>
            <section className="admin-stat-grid" aria-label="Tóm tắt thống kê admin">
              <article className="admin-stat-card">
                <div>
                  <p>Doanh thu đã ghi nhận</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(financialSummary.totalRevenue)}</strong>
                  <span>{financialSummary.invoiceCount} hóa đơn · TB/hóa đơn {formatCurrency(averageInvoiceValue)}</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Doanh thu đơn hàng</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(orderSummary.totalRevenue)}</strong>
                  <span>{orderSummary.orderCount.toLocaleString("vi-VN")} đơn · TB/đơn {formatCurrency(averageOrderValue)}</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Doanh thu chờ hóa đơn</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(orderToInvoiceRevenueGap)}</strong>
                  <span>{uninvoicedOrderCount.toLocaleString("vi-VN")} đơn chưa khớp hóa đơn</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Tỷ lệ phủ hóa đơn</p>
                  <strong>{loading ? "Đang tải..." : formatPercent(invoiceCoverageRate)}</strong>
                  <span>{financialSummary.invoiceCount} hóa đơn / {orderSummary.orderCount} đơn</span>
                </div>
              </article>
            </section>

            <section className="admin-panel admin-business-insight-panel" aria-label="Cảnh báo đối soát">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <p>Đối soát doanh thu</p>
                  <h2>Cần admin kiểm tra</h2>
                  <span>{businessRecommendation}</span>
                </div>
              </div>
              <ul className="admin-stat-list admin-stat-list--wide">
                <li>
                  <span>Giá trị trung bình mỗi đơn</span>
                  <strong>{formatCurrency(averageOrderValue)}</strong>
                  <small>Dựa trên thống kê đơn hàng theo bộ lọc hiện tại.</small>
                </li>
                <li>
                  <span>Sản phẩm mỗi đơn</span>
                  <strong>{unitsPerOrder.toFixed(1)}</strong>
                  <small>Tổng sản phẩm đã bán chia cho tổng số đơn.</small>
                </li>
                <li>
                  <span>Công thức doanh thu ghi nhận</span>
                  <strong>Tổng hóa đơn</strong>
                  <small>Doanh thu tài chính lấy từ hóa đơn; doanh thu đơn hàng lấy từ đơn.</small>
                </li>
              </ul>
            </section>

            <div className="admin-dashboard__grid admin-statistics-layout">
          <section className="admin-panel admin-metrics-panel">
            <div className="admin-panel__header admin-metrics-panel__header">
              <div>
                <p>Biểu đồ tổng hợp</p>
                <h2>Doanh thu đã ghi nhận và số hóa đơn</h2>
                <span>Cột dùng doanh thu báo cáo tài chính; đường dùng số hóa đơn.</span>
              </div>
            </div>

            {combinedSeries.length > 0 ? (
              <div className="admin-metrics-chart">
                <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label="Biểu đồ doanh thu và hóa đơn">
                  <defs>
                    <linearGradient id="adminRevenueBar" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <line className="admin-metrics-chart__grid" x1="48" x2="736" y1="96" y2="96" />
                  <line className="admin-metrics-chart__grid" x1="48" x2="736" y1="146" y2="146" />
                  <line
                    className="admin-metrics-chart__axis"
                    x1="48"
                    x2="736"
                    y1={chart.axisBottom}
                    y2={chart.axisBottom}
                  />
                  {chart.points.map((point) => (
                    <g key={point.item.period}>
                      <rect
                        className="admin-metrics-chart__bar"
                        height={point.barHeight}
                        rx="18"
                        width={chart.barWidth}
                        x={point.barX}
                        y={point.barY}
                      />
                      <text className="admin-metrics-chart__label" x={point.labelX} y="206">
                        {point.item.period}
                      </text>
                    </g>
                  ))}
                  {chart.linePoints ? (
                    <polyline className="admin-metrics-chart__line" points={chart.linePoints} />
                  ) : null}
                  {chart.points.map((point) => {
                    const invoiceMax = Math.max(...combinedSeries.map((item) => item.invoiceCount), 0);
                    const chartHeight = chart.height - 26 - 44;
                    const lineY =
                      invoiceMax > 0
                        ? 26 + chartHeight - (point.item.invoiceCount / invoiceMax) * chartHeight
                        : chart.axisBottom;

                    return (
                      <circle
                        key={`${point.item.period}-point`}
                        className="admin-metrics-chart__point"
                        cx={point.labelX}
                        cy={lineY}
                        r="5"
                      />
                    );
                  })}
                </svg>
                <div className="admin-metrics-chart__legend">
                  <span>
                    <i className="admin-metrics-chart__legend-bar" /> Doanh thu đã ghi nhận
                  </span>
                  <span>
                    <i className="admin-metrics-chart__legend-line" /> Hóa đơn
                  </span>
                </div>
              </div>
            ) : (
              <div className="admin-chart-empty">
                {loading ? "Đang tổng hợp dữ liệu biểu đồ..." : "Chưa có dữ liệu cho bộ lọc hiện tại."}
              </div>
            )}
          </section>

          <aside className="admin-dashboard__side">
            <section className="admin-panel">
              <div className="admin-panel__header">
                <h2>Điểm nhấn trong kỳ</h2>
              </div>
              <ul className="admin-stat-list admin-stat-list--wide">
                <li>
                  <span>Kỳ doanh thu cao nhất</span>
                  <strong>{peakPeriod?.period ?? "N/A"}</strong>
                  <small>
                    {peakPeriod ? formatCurrency(peakPeriod.totalRevenue) : "Chưa có dữ liệu"}
                  </small>
                </li>
                <li>
                  <span>Tổng hóa đơn</span>
                  <strong>{financialSummary.invoiceCount.toLocaleString("vi-VN")}</strong>
                  <small>{filters.currencyCode || "VND"} · báo cáo tài chính</small>
                </li>
                <li>
                  <span>Phí vận chuyển</span>
                  <strong>{formatCurrency(financialSummary.totalShippingFee)}</strong>
                  <small>Tách riêng để nguồn doanh thu luôn rõ ràng</small>
                </li>
                <li>
                  <span>Đơn chưa có hóa đơn</span>
                  <strong>{uninvoicedOrderCount.toLocaleString("vi-VN")}</strong>
                  <small>Ưu tiên xử lý nếu cần báo cáo doanh thu chính xác</small>
                </li>
                <li>
                  <span>Giảm giá</span>
                  <strong>{formatCurrency(financialSummary.totalDiscount)}</strong>
                  <small>{formatPercent(discountRate)} của tạm tính</small>
                </li>
                <li>
                  <span>Tổng item đã bán</span>
                  <strong>{orderSummary.itemCount.toLocaleString("vi-VN")}</strong>
                  <small>Từ thống kê đơn hàng theo cùng bộ lọc</small>
                </li>
              </ul>
            </section>
          </aside>
            </div>
          </>
        ) : null}

        {activeTab === "reconciliation" ? (
          <>
            <section className="admin-stat-grid" aria-label="Tóm tắt đối soát doanh thu">
              <article className="admin-stat-card">
                <div>
                  <p>Doanh thu đơn hàng</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(orderSummary.totalRevenue)}</strong>
                  <span>Nhu cầu đã ghi nhận từ thống kê đơn hàng</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Doanh thu đã ghi nhận</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(financialSummary.totalRevenue)}</strong>
                  <span>Doanh thu ghi nhận từ hóa đơn tài chính</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Chênh lệch doanh thu</p>
                  <strong>{loading ? "Đang tải..." : formatCurrency(orderToInvoiceRevenueGap)}</strong>
                  <span>Doanh thu đơn hàng trừ doanh thu đã ghi nhận</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Đơn chưa có hóa đơn</p>
                  <strong>{loading ? "Đang tải..." : uninvoicedOrderCount.toLocaleString("vi-VN")}</strong>
                  <span>{formatPercent(invoiceCoverageRate)} tỷ lệ phủ hóa đơn</span>
                </div>
              </article>
            </section>

            <section className="admin-panel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <p>Đối soát vận hành</p>
                  <h2>Cầu nối đơn hàng và hóa đơn</h2>
                  <span>Các số liệu bên dưới đều lấy từ API thống kê đơn hàng và báo cáo tài chính hiện tại.</span>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-reconciliation-table">
                  <thead>
                    <tr>
                      <th>Chỉ số</th>
                      <th>Giá trị</th>
                      <th>Nguồn</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Doanh thu đơn hàng</strong></td>
                      <td>{formatCurrency(orderSummary.totalRevenue)}</td>
                      <td>Thống kê đơn hàng</td>
                    </tr>
                    <tr>
                      <td><strong>Doanh thu đã ghi nhận</strong></td>
                      <td>{formatCurrency(financialSummary.totalRevenue)}</td>
                      <td>Hóa đơn tài chính</td>
                    </tr>
                    <tr>
                      <td><strong>Doanh thu chờ hóa đơn</strong></td>
                      <td>{formatCurrency(orderToInvoiceRevenueGap)}</td>
                      <td>Chênh lệch tính toán</td>
                    </tr>
                    <tr>
                      <td><strong>Đơn chưa có hóa đơn</strong></td>
                      <td>{uninvoicedOrderCount.toLocaleString("vi-VN")}</td>
                      <td>Chênh lệch số lượng</td>
                    </tr>
                    <tr>
                      <td><strong>Tỷ lệ phủ hóa đơn</strong></td>
                      <td>{formatPercent(invoiceCoverageRate)}</td>
                      <td>Hóa đơn / đơn hàng</td>
                    </tr>
                    <tr>
                      <td><strong>Phí vận chuyển</strong></td>
                      <td>{formatCurrency(financialSummary.totalShippingFee)}</td>
                      <td>Báo cáo tài chính</td>
                    </tr>
                    <tr>
                      <td><strong>Giảm giá</strong></td>
                      <td>{formatCurrency(financialSummary.totalDiscount)}</td>
                      <td>Báo cáo tài chính</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <div className="admin-orders-grid admin-statistics-breakdown-grid">
          <section className="admin-panel">
            <div className="admin-panel__header admin-orders-toolbar">
              <div>
                <h2>Bảng tổng hợp theo kỳ</h2>
                <span>Gộp thống kê đơn hàng và báo cáo tài chính trên cùng timeline.</span>
              </div>
            </div>

            {combinedSeries.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table admin-statistics-table">
                  <thead>
                    <tr>
                      <th>Kỳ</th>
                      <th>Đơn hàng</th>
                      <th>Sản phẩm</th>
                      <th>Hóa đơn</th>
                      <th>Doanh thu</th>
                      <th>Phí ship</th>
                      <th>Giảm giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedSeries.map((item) => (
                      <tr key={item.period}>
                        <td><strong>{item.period}</strong></td>
                        <td>{item.orderCount.toLocaleString("vi-VN")}</td>
                        <td>{item.itemCount.toLocaleString("vi-VN")}</td>
                        <td>{item.invoiceCount.toLocaleString("vi-VN")}</td>
                        <td><strong>{formatCurrency(item.totalRevenue)}</strong></td>
                        <td>{formatCurrency(item.totalShippingFee)}</td>
                        <td>{formatCurrency(item.totalDiscount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                {loading ? "Đang tải bảng tổng hợp..." : "Không có dòng dữ liệu để hiển thị."}
              </div>
            )}
          </section>

          <aside className="admin-orders-side">
            <section className="admin-panel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <h2>Chi tiết nguồn dữ liệu</h2>
                  <span>So sánh nhanh số đơn thống kê và hóa đơn tài chính.</span>
                </div>
              </div>
              <ul className="admin-stat-list admin-stat-list--wide">
                {orderStatistics.length > 0 ? (
                  orderStatistics.map((item) => (
                    <li key={`order-${item.period}`}>
                      <span>{item.period}</span>
                      <strong>{item.orderCount.toLocaleString("vi-VN")} đơn</strong>
                      <small>
                        {item.itemCount.toLocaleString("vi-VN")} sản phẩm · {formatCurrency(item.totalRevenue)}
                      </small>
                    </li>
                  ))
                ) : (
                  <li>
                    <span>Thống kê đơn hàng</span>
                    <strong>{loading ? "Đang tải..." : "Không có dữ liệu"}</strong>
                    <small>Bộ lọc hiện tại chưa trả về mốc thống kê đơn hàng.</small>
                  </li>
                )}
              </ul>
            </section>
          </aside>
            </div>
          </>
        ) : null}

        {activeTab === "operations" ? (
          <>
            <section className="admin-stat-grid" aria-label="Chỉ số vận hành">
              <article className="admin-stat-card">
                <div>
                  <p>Đơn trong kỳ</p>
                  <strong>{loading ? "Đang tải..." : operationStatistics.totalOrders.toLocaleString("vi-VN")}</strong>
                  <span>Tổng doanh thu {formatCurrency(operationStatistics.totalRevenue)}</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Cần sản xuất</p>
                  <strong>{loading ? "Đang tải..." : operationStatistics.ordersNeedingProduction.toLocaleString("vi-VN")}</strong>
                  <span>Pending, Processing hoặc Printing</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Cần giao hàng</p>
                  <strong>{loading ? "Đang tải..." : operationStatistics.ordersNeedingShipping.toLocaleString("vi-VN")}</strong>
                  <span>Đơn đang ở trạng thái Shipping</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Custom thiếu file in</p>
                  <strong>{loading ? "Đang tải..." : operationStatistics.customItemsNeedingExport.toLocaleString("vi-VN")}</strong>
                  <span>{operationStatistics.totalItems.toLocaleString("vi-VN")} sản phẩm trong kỳ</span>
                </div>
              </article>
            </section>

            <div className="admin-orders-grid admin-statistics-breakdown-grid">
              <section className="admin-panel">
                <div className="admin-panel__header admin-orders-toolbar">
                  <div>
                    <p>Ngoại lệ vận hành</p>
                    <h2>Cảnh báo cần xử lý ngay</h2>
                    <span>Danh sách việc cụ thể cần admin kiểm tra; các dòng đỏ là vấn đề đang ảnh hưởng vận hành.</span>
                  </div>
                </div>
                <ul className="admin-stat-list admin-stat-list--wide admin-operation-alert-list">
                  {operationStatistics.exceptions.map((item) => (
                    <li className={`admin-stat-list__item admin-stat-list__item--${item.count > 0 ? item.severity : "neutral"}`} key={item.label}>
                      <span>{item.label}</span>
                      <strong className="admin-stat-list__metric">
                        {item.count.toLocaleString("vi-VN")}
                      </strong>
                      <small>{getExceptionAction(item.label, item.severity)}</small>
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="admin-orders-side">
                <section className="admin-panel">
                  <div className="admin-panel__header admin-orders-toolbar">
                    <div>
                      <p>Phân bố SLA</p>
                      <h2>Tuổi đơn đang mở</h2>
                      <span>Cho biết backlog chưa hoàn tất đang nằm ở nhóm tuổi nào; chưa phải danh sách việc cần xử lý.</span>
                    </div>
                  </div>
                  <ul className="admin-stat-list admin-stat-list--wide">
                    {operationStatistics.agingBuckets.map((bucket) => {
                      const tone = getAgingBucketTone(bucket.label, bucket.orderCount);

                      return (
                      <li className={`admin-stat-list__item admin-stat-list__item--${tone}`} key={bucket.label}>
                        <span>{bucket.label}</span>
                        <strong className="admin-stat-list__metric">
                          {bucket.orderCount.toLocaleString("vi-VN")} đơn
                        </strong>
                        <small>{tone === "danger" ? "Quá SLA, cần ưu tiên" : "Theo dõi phân bố backlog"}</small>
                      </li>
                      );
                    })}
                  </ul>
                </section>
              </aside>
            </div>

            <section className="admin-panel">
              <div className="admin-panel__header admin-orders-toolbar">
                <div>
                  <p>Phân rã trạng thái</p>
                  <h2>Đơn hàng và thanh toán</h2>
                  <span>Backend trả về tất cả trạng thái trong cùng kỳ, không phụ thuộc bộ lọc trạng thái đơn/thanh toán.</span>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table admin-statistics-table">
                  <thead>
                    <tr>
                      <th>Nhóm</th>
                      <th>Trạng thái</th>
                      <th>Đơn</th>
                      <th>Sản phẩm</th>
                      <th>Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationStatistics.orderStatusBreakdown.map((item) => (
                      <tr key={`order-status-${item.status}`}>
                        <td>Đơn hàng</td>
                        <td><strong>{statusLabelByValue.get(item.status) ?? item.status}</strong></td>
                        <td>{item.orderCount.toLocaleString("vi-VN")}</td>
                        <td>{item.itemCount.toLocaleString("vi-VN")}</td>
                        <td>{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                    {operationStatistics.paymentStatusBreakdown.map((item) => (
                      <tr key={`payment-status-${item.status}`}>
                        <td>Thanh toán</td>
                        <td><strong>{statusLabelByValue.get(item.status) ?? item.status}</strong></td>
                        <td>{item.orderCount.toLocaleString("vi-VN")}</td>
                        <td>{item.itemCount.toLocaleString("vi-VN")}</td>
                        <td>{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "products" ? (
          <>
            <section className="admin-stat-grid" aria-label="Chỉ số sản phẩm và tùy chỉnh">
              <article className="admin-stat-card">
                <div>
                  <p>Tổng sản phẩm đã bán</p>
                  <strong>{loading ? "Đang tải..." : productStatistics.totalItemsSold.toLocaleString("vi-VN")}</strong>
                  <span>{productStatistics.totalOrders.toLocaleString("vi-VN")} đơn trong kỳ</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Sản phẩm tùy chỉnh</p>
                  <strong>{loading ? "Đang tải..." : productStatistics.customItemCount.toLocaleString("vi-VN")}</strong>
                  <span>Doanh thu {formatCurrency(productStatistics.customRevenue)}</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Sản phẩm có sẵn</p>
                  <strong>{loading ? "Đang tải..." : productStatistics.readyMadeItemCount.toLocaleString("vi-VN")}</strong>
                  <span>Doanh thu {formatCurrency(productStatistics.readyMadeRevenue)}</span>
                </div>
              </article>
              <article className="admin-stat-card">
                <div>
                  <p>Tỷ lệ tùy chỉnh</p>
                  <strong>{loading ? "Đang tải..." : formatPercent(safeDivide(productStatistics.customItemCount, productStatistics.totalItemsSold) * 100)}</strong>
                  <span>Custom / tổng sản phẩm đã bán</span>
                </div>
              </article>
            </section>
            <div className="admin-orders-grid admin-statistics-breakdown-grid">
              <section className="admin-panel">
                <div className="admin-panel__header admin-orders-toolbar">
                  <div>
                    <p>Xếp hạng sản phẩm</p>
                    <h2>Sản phẩm bán chạy</h2>
                    <span>Gom theo store product, gồm số lượng bán, số đơn, doanh thu và lượng item custom.</span>
                  </div>
                </div>
                <div className="admin-table-wrap">
                  <table className="admin-table admin-statistics-table">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Trường</th>
                        <th>Đã bán</th>
                        <th>Đơn</th>
                        <th>Custom</th>
                        <th>Doanh thu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStatistics.topStoreProducts.map((item) => (
                        <tr key={`${item.productId ?? "custom"}-${item.productName}`}>
                          <td><strong>{item.productName}</strong></td>
                          <td>{item.universityName ?? "N/A"}</td>
                          <td>{item.quantitySold.toLocaleString("vi-VN")}</td>
                          <td>{item.orderCount.toLocaleString("vi-VN")}</td>
                          <td>{item.customItemCount.toLocaleString("vi-VN")}</td>
                          <td>{formatCurrency(item.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="admin-orders-side">
                <section className="admin-panel">
                  <div className="admin-panel__header admin-orders-toolbar">
                    <div>
                      <p>Thiết kế tùy chỉnh</p>
                      <h2>Xu hướng custom</h2>
                      <span>So sánh item custom và item có sẵn theo nhóm thời gian.</span>
                    </div>
                  </div>
                  <ul className="admin-stat-list admin-stat-list--wide">
                    {productStatistics.customizationTrend.map((item) => (
                      <li key={item.period}>
                        <span>{item.period}</span>
                        <strong>{item.customItemCount.toLocaleString("vi-VN")} custom</strong>
                        <small>{item.readyMadeItemCount.toLocaleString("vi-VN")} có sẵn · {formatCurrency(item.customRevenue)}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>

            <div className="admin-orders-grid admin-statistics-breakdown-grid">
              <section className="admin-panel">
                <div className="admin-panel__header admin-orders-toolbar">
                  <div>
                    <p>Sản phẩm nền</p>
                    <h2>Base product bán chạy</h2>
                    <span>Gom theo mẫu nền để biết form áo/sản phẩm nào đang kéo nhu cầu.</span>
                  </div>
                </div>
                <ul className="admin-stat-list admin-stat-list--wide">
                  {productStatistics.topBaseProducts.map((item) => (
                    <li key={`${item.baseProductId ?? "unknown"}-${item.baseProductName}`}>
                      <span>{item.baseProductName}</span>
                      <strong>{item.quantitySold.toLocaleString("vi-VN")} bán</strong>
                      <small>{item.category ?? "N/A"} · {item.orderCount} đơn · {formatCurrency(item.revenue)}</small>
                    </li>
                  ))}
                </ul>
              </section>

              <aside className="admin-orders-side">
                <section className="admin-panel">
                  <div className="admin-panel__header admin-orders-toolbar">
                    <div>
                      <p>Trường học</p>
                      <h2>Top trường theo sản lượng</h2>
                      <span>Gom theo university của store product.</span>
                    </div>
                  </div>
                  <ul className="admin-stat-list admin-stat-list--wide">
                    {productStatistics.topUniversities.map((item) => (
                      <li key={`${item.universityId ?? "unknown"}-${item.universityName}`}>
                        <span>{item.universityName}</span>
                        <strong>{item.quantitySold.toLocaleString("vi-VN")} bán</strong>
                        <small>{item.orderCount} đơn · {formatCurrency(item.revenue)}</small>
                      </li>
                    ))}
                  </ul>
                </section>
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </AdminShell>
  );
}

export default AdminStatisticsPage;
