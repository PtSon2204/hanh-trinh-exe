import {
	faBoxOpen,
	faEye,
	faMoneyBillWave,
	faPaintBrush,
	faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PagedResult } from "../../../../shared/types/pagination";
import { AdminShell } from "../../components/AdminShell";
import { adminOrderApi } from "../../orders/api/adminOrderApi";
import type {
	AdminOrderListDto,
	AdminOrderStatisticDto,
	AdminOrderStatisticQuery,
} from "../../orders/types/adminOrder";

type DashboardState = {
	recentOrders: PagedResult<AdminOrderListDto> | null;
	statistics: AdminOrderStatisticDto[];
};

type ChartPoint = {
	barHeight: number;
	barX: number;
	barY: number;
	item: AdminOrderStatisticDto;
	labelX: number;
	orderPoint: string;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
	currency: "VND",
	maximumFractionDigits: 0,
	style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
	day: "2-digit",
	month: "2-digit",
	year: "numeric",
});

function toIsoDate(date: Date) {
	return date.toISOString().slice(0, 10);
}

function getDefaultStatisticQuery(): AdminOrderStatisticQuery {
	const toDate = new Date();
	const fromDate = new Date(toDate);
	fromDate.setDate(toDate.getDate() - 6);

	return {
		fromDate: toIsoDate(fromDate),
		groupBy: "day",
		toDate: toIsoDate(toDate),
	};
}

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
		normalized.includes("reject")
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

export function AdminDashboardPage() {
	const [dashboard, setDashboard] = useState<DashboardState>({
		recentOrders: null,
		statistics: [],
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadDashboard = useCallback(async () => {
		try {
			await Promise.resolve();
			setLoading(true);
			setError(null);

			const [recentOrders, statistics] = await Promise.all([
				adminOrderApi.getOrders(1, 5),
				adminOrderApi.getStatistics(getDefaultStatisticQuery()),
			]);

			setDashboard({ recentOrders, statistics });
		} catch (err) {
			console.error("Failed to load admin dashboard", err);
			setDashboard({ recentOrders: null, statistics: [] });
			setError("Không thể tải dữ liệu dashboard từ hệ thống.");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const dashboardLoadTimer = window.setTimeout(() => {
			void loadDashboard();
		}, 0);

		return () => window.clearTimeout(dashboardLoadTimer);
	}, [loadDashboard]);

	const summary = useMemo(() => {
		return dashboard.statistics.reduce(
			(current, item) => ({
				itemCount: current.itemCount + item.itemCount,
				orderCount: current.orderCount + item.orderCount,
				totalRevenue: current.totalRevenue + item.totalRevenue,
			}),
			{ itemCount: 0, orderCount: 0, totalRevenue: 0 },
		);
	}, [dashboard.statistics]);

	const chart = useMemo(() => {
		const width = 760;
		const height = 220;
		const left = 48;
		const right = 24;
		const top = 26;
		const bottom = 44;
		const chartHeight = height - top - bottom;
		const chartWidth = width - left - right;
		const revenueMax = Math.max(
			...dashboard.statistics.map((item) => item.totalRevenue),
			0,
		);
		const orderMax = Math.max(
			...dashboard.statistics.map((item) => item.orderCount),
			0,
		);
		const slot =
			dashboard.statistics.length > 0
				? chartWidth / dashboard.statistics.length
				: 0;
		const barWidth = Math.min(44, Math.max(18, slot * 0.46));
		const points: ChartPoint[] = dashboard.statistics.map((item, index) => {
			const labelX = left + slot * index + slot / 2;
			const revenueRatio = revenueMax > 0 ? item.totalRevenue / revenueMax : 0;
			const orderRatio = orderMax > 0 ? item.orderCount / orderMax : 0;
			const barHeight =
				revenueRatio > 0 ? Math.max(4, revenueRatio * chartHeight) : 0;
			const barX = labelX - barWidth / 2;
			const barY = top + chartHeight - barHeight;
			const orderY = top + chartHeight - orderRatio * chartHeight;

			return {
				barHeight,
				barX,
				barY,
				item,
				labelX,
				orderPoint: `${labelX},${orderY}`,
			};
		});

		return {
			axisBottom: top + chartHeight,
			barWidth,
			height,
			linePoints: points.map((point) => point.orderPoint).join(" "),
			points,
			width,
		};
	}, [dashboard.statistics]);

	const stats = [
		{
			icon: faMoneyBillWave,
			label: "Doanh thu 7 ngày",
			note: "Tính từ dữ liệu đơn hàng thực tế",
			tone: "indigo",
			value: loading ? "Đang tải..." : formatCurrency(summary.totalRevenue),
		},
		{
			icon: faBoxOpen,
			label: "Đơn hàng 7 ngày",
			note: "Theo API thống kê đơn hàng",
			tone: "blue",
			value: loading
				? "Đang tải..."
				: summary.orderCount.toLocaleString("vi-VN"),
		},
		{
			icon: faPaintBrush,
			label: "Sản phẩm trong đơn",
			note: "Tổng số lượng item đã ghi nhận",
			tone: "violet",
			value: loading
				? "Đang tải..."
				: summary.itemCount.toLocaleString("vi-VN"),
		},
		{
			icon: faUserPlus,
			label: "Tổng đơn hiện có",
			note: "Từ danh sách đơn hàng admin",
			tone: "green",
			value: loading
				? "Đang tải..."
				: (dashboard.recentOrders?.totalRecords ?? 0).toLocaleString("vi-VN"),
		},
	];

	const recentOrders = dashboard.recentOrders?.data ?? [];
	const hasStatistics = dashboard.statistics.length > 0;

	return (
		<AdminShell activePath="/admin">
			<div className="admin-dashboard">
				<div className="admin-dashboard__heading">
					<div>
						<p>Dashboard quản trị</p>
						<h1>
							Xin chào <span aria-hidden="true">👋</span>
						</h1>
					</div>
					<button
						className="admin-refresh-button"
						type="button"
						onClick={() => void loadDashboard()}
						disabled={loading}
					>
						{loading ? "Đang tải..." : "Tải lại dữ liệu"}
					</button>
				</div>

				{error ? (
					<div className="admin-alert" role="alert">
						{error}
					</div>
				) : null}

				<section className="admin-stat-grid" aria-label="Chỉ số nhanh">
					{stats.map((stat) => (
						<article className="admin-stat-card" key={stat.label}>
							<span
								className={`admin-stat-card__icon admin-stat-card__icon--${stat.tone}`}
								aria-hidden="true"
							>
								<FontAwesomeIcon icon={stat.icon} />
							</span>
							<div>
								<p>{stat.label}</p>
								<strong>{stat.value}</strong>
								<span>{stat.note}</span>
							</div>
						</article>
					))}
				</section>

				<div className="admin-dashboard__grid">
					<section className="admin-panel admin-panel--orders">
						<div className="admin-panel__header">
							<h2>Đơn hàng cần xử lý</h2>
							<a href="/admin/orders">Xem tất cả</a>
						</div>

						{loading ? (
							<div className="admin-empty-state">
								Đang tải đơn hàng từ hệ thống...
							</div>
						) : recentOrders.length > 0 ? (
							<div className="admin-table-wrap">
								<table className="admin-table">
									<thead>
										<tr>
											<th>Mã ĐH</th>
											<th>Khách hàng</th>
											<th>Ngày tạo</th>
											<th>Tổng tiền</th>
											<th>Trạng thái</th>
											<th aria-label="Thao tác" />
										</tr>
									</thead>
									<tbody>
										{recentOrders.map((order) => (
											<tr key={order.orderId}>
												<td>
													<strong>{order.orderCode}</strong>
												</td>
												<td>
													<strong>{order.userEmail}</strong>
													<span>{order.paymentStatus}</span>
												</td>
												<td>{formatDate(order.createdAt)}</td>
												<td>
													<strong>{formatCurrency(order.totalAmount)}</strong>
												</td>
												<td>
													<span
														className={`admin-status admin-status--${getStatusTone(order.orderStatus)}`}
													>
														{order.orderStatus}
													</span>
												</td>
												<td>
													<a
														className="admin-detail-link"
														href={`/admin/orders/${order.orderId}`}
													>
														<FontAwesomeIcon icon={faEye} /> Chi tiết
													</a>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="admin-empty-state">
								Chưa có đơn hàng thực tế để hiển thị.
							</div>
						)}
					</section>

					<aside className="admin-dashboard__side">
						<section className="admin-panel">
							<h2>Doanh thu 7 ngày qua</h2>
							{loading ? (
								<div className="admin-empty-state">Đang tải thống kê...</div>
							) : hasStatistics ? (
								<ul className="admin-stat-list">
									{dashboard.statistics.map((item) => (
										<li key={item.period}>
											<span>{item.period}</span>
											<strong>{formatCurrency(item.totalRevenue)}</strong>
											<small>
												{item.orderCount.toLocaleString("vi-VN")} đơn hàng
											</small>
										</li>
									))}
								</ul>
							) : (
								<div className="admin-empty-state">
									Chưa có thống kê doanh thu từ API.
								</div>
							)}
						</section>

						<section className="admin-panel">
							<h2>Tình trạng dữ liệu</h2>
							<div className="admin-data-note">
								<strong>
									{error ? "Cần kiểm tra kết nối API" : "Đã bỏ dữ liệu mẫu"}
								</strong>
								<span>
									Dashboard hiện chỉ hiển thị dữ liệu trả về từ API đơn hàng và
									thống kê. Các khối chưa có endpoint riêng sẽ ở trạng thái rỗng
									thay vì dùng số liệu giả.
								</span>
							</div>
						</section>
					</aside>
				</div>

				<section className="admin-panel admin-metrics-panel">
					<div className="admin-panel__header admin-metrics-panel__header">
						<div>
							<p>Xu hướng vận hành</p>
							<h2>Thống kê doanh thu và đơn hàng</h2>
						</div>
						<span>7 ngày gần nhất</span>
					</div>

					{loading ? (
						<div className="admin-chart-empty">
							Đang tải biểu đồ thống kê...
						</div>
					) : hasStatistics ? (
						<div
							className="admin-metrics-chart"
							role="img"
							aria-label="Biểu đồ doanh thu và số đơn hàng 7 ngày gần nhất"
						>
							<svg
								viewBox={`0 0 ${chart.width} ${chart.height}`}
								aria-hidden="true"
							>
								<defs>
									<linearGradient
										id="adminRevenueBar"
										x1="0"
										x2="0"
										y1="0"
										y2="1"
									>
										<stop offset="0" stopColor="#4f46e5" stopOpacity="0.86" />
										<stop offset="1" stopColor="#38bdf8" stopOpacity="0.42" />
									</linearGradient>
								</defs>
								{[0, 1, 2, 3].map((line) => (
									<line
										className="admin-metrics-chart__grid"
										key={line}
										x1="48"
										x2="736"
										y1={26 + line * 50}
										y2={26 + line * 50}
									/>
								))}
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
											rx="8"
											width={chart.barWidth}
											x={point.barX}
											y={point.barY}
										/>
										<text
											className="admin-metrics-chart__label"
											x={point.labelX}
											y="204"
										>
											{point.item.period}
										</text>
									</g>
								))}
								{chart.linePoints ? (
									<polyline
										className="admin-metrics-chart__line"
										points={chart.linePoints}
									/>
								) : null}
								{chart.points.map((point) => {
									const [cx, cy] = point.orderPoint.split(",");

									return (
										<circle
											className="admin-metrics-chart__point"
											cx={cx}
											cy={cy}
											key={`${point.item.period}-orders`}
											r="5"
										/>
									);
								})}
							</svg>
							<div className="admin-metrics-chart__legend">
								<span>
									<i className="admin-metrics-chart__legend-bar" /> Doanh thu
								</span>
								<span>
									<i className="admin-metrics-chart__legend-line" /> Đơn hàng
								</span>
							</div>
						</div>
					) : (
						<div className="admin-chart-empty">
							Chưa có dữ liệu thống kê để vẽ biểu đồ. Khi API trả về dữ liệu
							thật, biểu đồ này sẽ tự hiển thị doanh thu và số đơn theo ngày.
						</div>
					)}
				</section>
			</div>
		</AdminShell>
	);
}
