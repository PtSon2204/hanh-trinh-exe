import { fabric } from "fabric";
import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveApiAssetUrl } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminOrderApi } from "../api/adminOrderApi";
import type {
  AdminOrderDto,
  AdminOrderFabricPrintFileItemDto,
  AdminOrderItemDto,
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

const paymentStatusOptions = ["Pending", "Paid", "Failed", "RefundPending", "Refunded"];

type AdminOrdersPanel = "orders" | "statistics" | "printFiles";

type PrintAreaRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ProductPrintArea = {
  front?: PrintAreaRect;
  back?: PrintAreaRect;
};

type CanvasBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PrintSide = "front" | "back";

type SideImage = {
  label: string;
  dataUrl: string;
};

const FABRIC_EXPORT_WIDTH = 800;
const FABRIC_EXPORT_HEIGHT = 1000;
const FABRIC_ARTWORK_MULTIPLIER = 2;
const PLACEMENT_GUIDE_WIDTH = 1200;
const PLACEMENT_GUIDE_HEIGHT = 1500;
const MAX_FABRIC_UPLOAD_PNG_BYTES = 15 * 1024 * 1024; // 15MB

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isPrintAreaRect(value: unknown): value is PrintAreaRect {
  if (!isRecord(value)) return false;

  const { x, y, width, height } = value;
  return (
    typeof x === "number" &&
    Number.isFinite(x) &&
    typeof y === "number" &&
    Number.isFinite(y) &&
    typeof width === "number" &&
    Number.isFinite(width) &&
    width > 0 &&
    typeof height === "number" &&
    Number.isFinite(height) &&
    height > 0
  );
}

function parsePrintArea(printAreaJson: string | null): ProductPrintArea | null {
  if (!printAreaJson) return null;

  try {
    const parsed: unknown = JSON.parse(printAreaJson);
    if (!isRecord(parsed)) return null;

    const printArea: ProductPrintArea = {};
    if (parsed.front !== undefined) {
      if (!isPrintAreaRect(parsed.front)) return null;
      printArea.front = parsed.front;
    }

    if (parsed.back !== undefined) {
      if (!isPrintAreaRect(parsed.back)) return null;
      printArea.back = parsed.back;
    }

    return printArea;
  } catch {
    return null;
  }
}

function getCanvasPrintBounds(rect: PrintAreaRect | undefined): CanvasBounds {
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return {
      left: 0,
      top: 0,
      width: FABRIC_EXPORT_WIDTH,
      height: FABRIC_EXPORT_HEIGHT,
    };
  }

  const normalized =
    rect.x >= 0 &&
    rect.x <= 1 &&
    rect.y >= 0 &&
    rect.y <= 1 &&
    rect.width > 0 &&
    rect.width <= 1 &&
    rect.height > 0 &&
    rect.height <= 1;
  const rawBounds = normalized
    ? {
        left: rect.x * FABRIC_EXPORT_WIDTH,
        top: rect.y * FABRIC_EXPORT_HEIGHT,
        width: rect.width * FABRIC_EXPORT_WIDTH,
        height: rect.height * FABRIC_EXPORT_HEIGHT,
      }
    : {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
      };
  const left = clamp(rawBounds.left, 0, FABRIC_EXPORT_WIDTH);
  const top = clamp(rawBounds.top, 0, FABRIC_EXPORT_HEIGHT);

  return {
    left,
    top,
    width: clamp(rawBounds.width, 1, Math.max(1, FABRIC_EXPORT_WIDTH - left)),
    height: clamp(rawBounds.height, 1, Math.max(1, FABRIC_EXPORT_HEIGHT - top)),
  };
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Cannot load image: ${url}`));
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

function estimateDataUrlBytes(dataUrl: string) {
  const markerIndex = dataUrl.indexOf(",");
  if (markerIndex < 0) return dataUrl.length;

  const base64 = dataUrl.slice(markerIndex + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

function assertGeneratedPngSize(dataUrl: string, label: string) {
  if (estimateDataUrlBytes(dataUrl) > MAX_FABRIC_UPLOAD_PNG_BYTES) {
    throw new Error(`${label} must be 5MB or smaller`);
  }
}

function getSideLabel(side: PrintSide) {
  return side === "front" ? "Mặt trước" : "Mặt sau";
}

function getOrderItemBacktrackLabel(orderCode: string, item: AdminOrderItemDto) {
  return `${orderCode} · item #${item.orderItemId} · design #${item.designId ?? "N/A"}`;
}

function getFabricExportSides(item: AdminOrderItemDto) {
  const sides: Array<{ side: PrintSide; canvasJson: string }> = [];
  const frontCanvasJson = item.frontCanvasJson ?? item.canvasJson;
  if (frontCanvasJson) {
    sides.push({ side: "front", canvasJson: frontCanvasJson });
  }
  if (item.backCanvasJson) {
    sides.push({ side: "back", canvasJson: item.backCanvasJson });
  }
  return sides;
}

function canExportFabricItem(item: AdminOrderItemDto) {
  return item.designId !== null && getFabricExportSides(item).length > 0;
}

function getSidePreviewUrl(item: AdminOrderItemDto, side: PrintSide) {
  if (side === "front") {
    return resolveApiAssetUrl(
      item.frontPreviewImageUrl ?? item.previewImageUrl ?? item.imageUrl,
    );
  }

  return resolveApiAssetUrl(item.backPreviewImageUrl ?? item.productBackImageUrl);
}

async function combinePngDataUrls(
  title: string,
  images: SideImage[],
  label: string,
) {
  if (images.length === 0) {
    throw new Error(`${label} has no image to export`);
  }

  if (images.length === 1) {
    return images[0].dataUrl;
  }

  const loadedImages = await Promise.all(
    images.map(async (image) => ({
      ...image,
      element: await loadImage(image.dataUrl),
    })),
  );
  const headerHeight = 76;
  const gap = 28;
  const width = Math.max(...loadedImages.map((image) => image.element.width));
  const height = loadedImages.reduce(
    (total, image) => total + headerHeight + image.element.height + gap,
    0,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Cannot create combined ${label} canvas`);
  }

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, width, height);
  let top = 0;
  for (const image of loadedImages) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "700 26px sans-serif";
    ctx.fillText(title, 24, top + 32);
    ctx.fillStyle = "#334155";
    ctx.font = "600 20px sans-serif";
    ctx.fillText(image.label, 24, top + 60);
    ctx.drawImage(image.element, (width - image.element.width) / 2, top + headerHeight);
    top += headerHeight + image.element.height + gap;
  }

  const dataUrl = canvas.toDataURL("image/png");
  assertGeneratedPngSize(dataUrl, label);
  return dataUrl;
}

async function createFabricCanvas(canvasJson: string) {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = FABRIC_EXPORT_WIDTH;
  canvasElement.height = FABRIC_EXPORT_HEIGHT;
  const canvas = new fabric.StaticCanvas(canvasElement, {
    backgroundColor: "transparent",
    height: FABRIC_EXPORT_HEIGHT,
    width: FABRIC_EXPORT_WIDTH,
  });

  await new Promise<void>((resolve) => {
    canvas.loadFromJSON(canvasJson, () => {
      canvas.renderAll();
      resolve();
    });
  });

  return canvas;
}

async function createPreviewPlacementGuide(
  item: AdminOrderItemDto,
  orderCode: string,
  side: PrintSide,
) {
  const previewUrl = getSidePreviewUrl(item, side);
  if (!previewUrl) {
    throw new Error(`Order item ${item.orderItemId} has no ${side} preview image`);
  }

  const guideCanvas = document.createElement("canvas");
  guideCanvas.width = PLACEMENT_GUIDE_WIDTH;
  guideCanvas.height = PLACEMENT_GUIDE_HEIGHT;
  const ctx = guideCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Cannot create placement guide canvas");
  }

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, guideCanvas.width, guideCanvas.height);

  const previewImage = await loadImage(previewUrl);
  // Vẽ ảnh áo từ vị trí y = 90 để chừa khoảng trống cho text cỡ chữ lớn hơn ở trên đầu
  drawContainedImage(ctx, previewImage, 0, 90, guideCanvas.width, guideCanvas.height - 90);

  ctx.fillStyle = "#111827";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(getOrderItemBacktrackLabel(orderCode, item), 24, 40);
  ctx.font = "24px sans-serif";
  ctx.fillText(`${getSideLabel(side)} · Size ${item.size} · SL ${item.quantity}`, 24, 75);

  const placementGuidePngDataUrl = guideCanvas.toDataURL("image/png");
  assertGeneratedPngSize(placementGuidePngDataUrl, "Placement guide PNG");

  return placementGuidePngDataUrl;
}

async function createFabricPrintFile(item: AdminOrderItemDto, orderCode: string) {
  const sides = getFabricExportSides(item);
  if (sides.length === 0) {
    throw new Error(`Order item ${item.orderItemId} has no Fabric canvas JSON`);
  }

  const printArea = parsePrintArea(item.printAreaJson);
  const artworkImages: SideImage[] = [];
  const guideImages: SideImage[] = [];

  for (const sideExport of sides) {
    const canvas = await createFabricCanvas(sideExport.canvasJson);
    const bounds = getCanvasPrintBounds(printArea?.[sideExport.side]);
    try {
      const artworkPngDataUrl = canvas.toDataURL({
        format: "png",
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        multiplier: FABRIC_ARTWORK_MULTIPLIER,
      });
      assertGeneratedPngSize(artworkPngDataUrl, `${getSideLabel(sideExport.side)} artwork PNG`);
      artworkImages.push({
        label: `${getSideLabel(sideExport.side)} · Size ${item.size} · SL ${item.quantity}`,
        dataUrl: artworkPngDataUrl,
      });
    } finally {
      canvas.dispose();
    }

    guideImages.push({
      label: `${getSideLabel(sideExport.side)} · guide đặt in`,
      dataUrl: await createPreviewPlacementGuide(item, orderCode, sideExport.side),
    });
  }

  const title = getOrderItemBacktrackLabel(orderCode, item);

  return {
    orderItemId: item.orderItemId,
    artworkPngDataUrl: await combinePngDataUrls(title, artworkImages, "Artwork PNG"),
    placementGuidePngDataUrl: await combinePngDataUrls(title, guideImages, "Placement guide PNG"),
  } satisfies AdminOrderFabricPrintFileItemDto;
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
  const [exportingFabricOrderId, setExportingFabricOrderId] = useState<
    number | null
  >(null);
  const [exportingFabricItemId, setExportingFabricItemId] = useState<number | null>(null);
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

  const exportSelectedOrderFabricPrintFiles = async (orderId: number) => {
    try {
      setExportingFabricOrderId(orderId);
      setActionError(null);
      setActionMessage(null);

      const orderDetail =
        selectedOrder?.orderId === orderId
          ? selectedOrder
          : await adminOrderApi.getOrderById(orderId);
      const designItems = orderDetail.items.filter(canExportFabricItem);

      if (designItems.length === 0) {
        setActionError("Đơn hàng không có thiết kế Fabric để xuất.");
        return;
      }

      const items = await Promise.all(
        designItems.map((item) => createFabricPrintFile(item, orderDetail.orderCode)),
      );
      const files = await adminOrderApi.saveFabricPrintFiles(orderId, { items });
      setSelectedOrder(orderDetail);
      setPrintFiles(files);
      setActivePanel("printFiles");
      setActionMessage("Đã xuất artwork thiết kế in bằng Fabric cho đơn hàng.");
    } catch (err) {
      console.error("Failed to export Fabric admin order print files", err);
      setActionError("Không thể xuất artwork bằng Fabric cho đơn hàng.");
    } finally {
      setExportingFabricOrderId(null);
    }
  };

  const exportOrderItemFabricPrintFile = async (
    order: AdminOrderDto,
    item: AdminOrderItemDto,
  ) => {
    try {
      setExportingFabricItemId(item.orderItemId);
      setActionError(null);
      setActionMessage(null);

      if (!canExportFabricItem(item)) {
        setActionError("Sản phẩm này không có thiết kế Fabric để xuất.");
        return;
      }

      const uploadItem = await createFabricPrintFile(item, order.orderCode);
      const files = await adminOrderApi.saveFabricPrintFiles(order.orderId, {
        items: [uploadItem],
      });
      setPrintFiles((current) => {
        const remaining = current.filter(
          (file) => file.orderItemId !== item.orderItemId,
        );
        return [...files, ...remaining];
      });
      setActivePanel("printFiles");
      setActionMessage(
        `Đã xuất artwork cho ${order.orderCode} · item #${item.orderItemId}.`,
      );
    } catch (err) {
      console.error("Failed to export Fabric admin order item print file", err);
      setActionError("Không thể xuất artwork Fabric cho sản phẩm này.");
    } finally {
      setExportingFabricItemId(null);
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
                                className="admin-artwork-action"
                                type="button"
                                onClick={() =>
                                  void exportSelectedOrderFabricPrintFiles(
                                    order.orderId,
                                  )
                                }
                                disabled={
                                  exportingFabricOrderId === order.orderId
                                }
                              >
                                {exportingFabricOrderId === order.orderId
                                  ? "Đang xuất..."
                                  : "Xuất artwork Fabric"}
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
                  <span>PNG artwork để in và guide đặt vị trí trên áo cho xưởng</span>
                </div>
              </div>
              {printFiles.length > 0 ? (
                <ul className="admin-print-files">
                  {printFiles.map((file) => {
                    const printFileUrl = adminOrderApi.resolvePrintFileUrl(
                      file.printFileUrl,
                    );
                    const placementGuideUrl = adminOrderApi.resolvePrintFileUrl(
                      file.placementGuideUrl,
                    );

                    return <li key={file.orderItemId}>
                      <div>
                        <strong>{file.designName ?? file.orderCode}</strong>
                        <span>
                          {file.orderCode} · Order #{file.orderId} · Item #{file.orderItemId} · Design #{file.designId}
                        </span>
                        <span>
                          Size {file.size} · SL {file.quantity}
                        </span>
                      </div>
                      <a
                        href={printFileUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở artwork in
                      </a>
                      <a
                        href={placementGuideUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Mở guide đặt in
                      </a>
                    </li>;
                  })}
                </ul>
              ) : (
                <div className="admin-empty-state">
                  Chọn một đơn hàng rồi bấm Xuất artwork để hiển thị artwork PNG và guide đặt in.
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

                {selectedOrder.refundAccountNumber && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 mt-4 text-left" style={{ gridColumn: "span 2" }}>
                    <p className="text-red-700 font-extrabold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <i className="fa-solid fa-building-columns"></i> Thông tin hoàn tiền (Khách hủy đơn)
                    </p>
                    <ul className="text-xs text-red-600 space-y-1.5 list-none pl-0">
                      <li><strong>Ngân hàng:</strong> {selectedOrder.refundBankName}</li>
                      <li><strong>Số tài khoản:</strong> {selectedOrder.refundAccountNumber}</li>
                      <li><strong>Chủ tài khoản:</strong> {selectedOrder.refundAccountName}</li>
                    </ul>
                    <p className="text-[10px] text-red-500 mt-3 italic leading-normal">
                      * Vui lòng chuyển khoản hoàn tiền cho khách theo thông tin trên, sau đó chuyển trạng thái thanh toán sang "Refunded" để hoàn tất.
                    </p>
                  </div>
                )}

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
                    className="admin-artwork-action"
                    type="button"
                    onClick={() =>
                      void exportSelectedOrderFabricPrintFiles(
                        selectedOrder.orderId,
                      )
                    }
                    disabled={
                      exportingFabricOrderId === selectedOrder.orderId
                    }
                  >
                    {exportingFabricOrderId === selectedOrder.orderId
                      ? "Đang xuất..."
                      : "Xuất artwork Fabric"}
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
                      <small>
                        {item.requiresSize ? `Size ${item.size} · ` : ""}Item #{item.orderItemId}
                        {item.designId ? ` · Design #${item.designId}` : ""}
                      </small>
                      <button
                        className="admin-artwork-item-button"
                        type="button"
                        onClick={() =>
                          void exportOrderItemFabricPrintFile(selectedOrder, item)
                        }
                        disabled={
                          exportingFabricItemId === item.orderItemId ||
                          !canExportFabricItem(item)
                        }
                      >
                        {exportingFabricItemId === item.orderItemId
                          ? "Đang xuất..."
                          : "Xuất artwork item"}
                      </button>
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
