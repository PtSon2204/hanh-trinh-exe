import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "../../../../shared/api/axiosClient";
import type { PagedResult } from "../../../../shared/types/pagination";
import { adminVoucherApi } from "../api/adminVoucherApi";
import type {
	AdminVoucherListDto,
	AdminVoucherDto,
	AdminCreateVoucherDto,
	AdminVoucherQuery,
} from "../types/adminVoucher";

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

function formatCurrency(value: number) {
	return currencyFormatter.format(value);
}

function formatDate(value: string | null) {
	if (!value) return "---";
	return dateFormatter.format(new Date(value));
}

function toInputDate(isoString: string) {
	if (!isoString) return "";
	return isoString.slice(0, 10);
}

const emptyVoucherForm: AdminCreateVoucherDto = {
	code: "",
	discountPercent: 10,
	maxDiscount: 30000,
	minOrderAmount: 0,
	usageLimit: 100,
	startDate: new Date().toISOString().slice(0, 10) + "T00:00:00Z",
	endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + "T23:59:59Z",
	isActive: true,
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

export function AdminVoucherPage() {
	const [vouchers, setVouchers] = useState<PagedResult<AdminVoucherListDto> | null>(null);
	const [selectedVoucher, setSelectedVoucher] = useState<AdminVoucherDto | null>(null);
	
	// Form state
	const [form, setForm] = useState<AdminCreateVoucherDto>(emptyVoucherForm);
	
	// Voucher sub-type selection state: percentage vs freeShipping
	const [voucherType, setVoucherType] = useState<"percent" | "freeship">("percent");
	const [userCodeSuffix, setUserCodeSuffix] = useState("");

	// Query states
	const [pageNumber, setPageNumber] = useState(1);
	const [pageSize, setPageSize] = useState(10);
	const [codeFilter, setCodeFilter] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState<"all" | "percent" | "freeship">("all");

	// Loading/Saving states
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [detailLoading, setDetailLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const query: AdminVoucherQuery = useMemo(
		() => ({
			code: codeFilter.trim() || undefined,
			isActive: statusFilter === "all" ? undefined : statusFilter === "active",
			pageNumber,
			pageSize,
		}),
		[codeFilter, pageNumber, pageSize, statusFilter],
	);

	const loadVouchers = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const result = await adminVoucherApi.getVouchers(query);
			setVouchers(result);
		} catch (err) {
			console.error("Failed to load vouchers", err);
			setVouchers(emptyPage(query.pageNumber, query.pageSize));
			setError("Không thể tải danh sách voucher từ hệ thống.");
		} finally {
			setLoading(false);
		}
	}, [query]);

	useEffect(() => {
		void loadVouchers();
	}, [loadVouchers]);

	// Open voucher details for editing
	const openVoucher = async (id: number) => {
		try {
			setDetailLoading(true);
			setError(null);
			const detail = await adminVoucherApi.getVoucherById(id);
			setSelectedVoucher(detail);
			
			// Determine UI type
			const isFreeship = detail.code.toUpperCase().includes("FREESHIP");
			setVoucherType(isFreeship ? "freeship" : "percent");
			
			if (isFreeship) {
				const parts = detail.code.split("FREESHIP-");
				setUserCodeSuffix(parts.length > 1 ? parts[1] : detail.code.replace("FREESHIP", ""));
			} else {
				setUserCodeSuffix("");
			}

			setForm({
				code: detail.code,
				discountPercent: Number(detail.discountPercent),
				maxDiscount: Number(detail.maxDiscount),
				minOrderAmount: Number(detail.minOrderAmount),
				usageLimit: detail.usageLimit,
				startDate: detail.startDate,
				endDate: detail.endDate,
				isActive: detail.isActive,
			});
		} catch (err) {
			console.error("Failed to load voucher detail", err);
			toast.error("Không thể lấy chi tiết voucher.");
		} finally {
			setDetailLoading(false);
		}
	};

	const startCreate = () => {
		setSelectedVoucher(null);
		setForm(emptyVoucherForm);
		setVoucherType("percent");
		setUserCodeSuffix("");
		setError(null);
	};

	// Enforce FREESHIP prepending or direct code manipulation
	const finalCode = useMemo(() => {
		if (voucherType === "freeship") {
			const cleanedSuffix = userCodeSuffix.toUpperCase().replace(/[^A-Z0-9]/g, "");
			return cleanedSuffix ? `FREESHIP-${cleanedSuffix}` : "FREESHIP";
		}
		return form.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
	}, [voucherType, form.code, userCodeSuffix]);

	const submitForm = async () => {
		// Validations
		if (voucherType === "freeship" && !userCodeSuffix.trim()) {
			toast.error("Vui lòng nhập hậu tố cho mã Freeship (vd: JUNE, HOT)");
			return;
		}
		if (voucherType === "percent" && !form.code.trim()) {
			toast.error("Vui lòng nhập mã giảm giá");
			return;
		}

		try {
			setSaving(true);
			setError(null);

			// Pre-fill parameters for freeship to satisfy validator rules of ASP.NET (5% <= DiscountPercent <= 20% & MaxDiscount <= 400k)
			const discountPercentPayload = voucherType === "freeship" ? 10 : form.discountPercent;
			const maxDiscountPayload = voucherType === "freeship" ? 30000 : form.maxDiscount;

			// Validate percentage discount bounds
			if (voucherType === "percent") {
				if (discountPercentPayload < 1 || discountPercentPayload > 100) {
					toast.error("Tỉ lệ giảm giá phải từ 1% đến 100%");
					setSaving(false);
					return;
				}
				if (maxDiscountPayload <= 0 || maxDiscountPayload > 50000000) {
					toast.error("Giảm giá tối đa phải lớn hơn 0đ và không vượt quá 50.000.000đ");
					setSaving(false);
					return;
				}
			}

			const payload: AdminCreateVoucherDto = {
				...form,
				code: finalCode,
				discountPercent: discountPercentPayload,
				maxDiscount: maxDiscountPayload,
				minOrderAmount: Number(form.minOrderAmount),
				usageLimit: Number(form.usageLimit),
			};

			let response;
			if (selectedVoucher) {
				response = await adminVoucherApi.updateVoucher(selectedVoucher.voucherId, payload);
			} else {
				response = await adminVoucherApi.createVoucher(payload);
			}

			toast.success(response.message || "Đã lưu voucher thành công!");
			await loadVouchers();
			startCreate();
		} catch (err) {
			console.error("Failed to save voucher", err);
			const errMsg = getApiErrorMessage(err, "Không thể lưu voucher.");
			setError(errMsg);
			toast.error(errMsg);
		} finally {
			setSaving(false);
		}
	};

	const deleteVoucher = async (id: number, code: string) => {
		if (!window.confirm(`Bạn có chắc chắn muốn xoá voucher ${code}?`)) return;

		try {
			setSaving(true);
			const response = await adminVoucherApi.deleteVoucher(id);
			toast.success(response.message || `Đã xoá voucher ${code} thành công.`);
			startCreate();
			await loadVouchers();
		} catch (err) {
			console.error("Failed to delete voucher", err);
			toast.error("Không thể xoá voucher. Mã này có thể đã được gắn vào đơn hàng.");
		} finally {
			setSaving(false);
		}
	};

	// Toggle isActive directly from table row
	const toggleVoucherActive = async (voucher: AdminVoucherListDto) => {
		try {
			const detail = await adminVoucherApi.getVoucherById(voucher.voucherId);
			const payload: AdminCreateVoucherDto = {
				code: detail.code,
				discountPercent: Number(detail.discountPercent),
				maxDiscount: Number(detail.maxDiscount),
				minOrderAmount: Number(detail.minOrderAmount),
				usageLimit: detail.usageLimit,
				startDate: detail.startDate,
				endDate: detail.endDate,
				isActive: !detail.isActive, // Toggle
			};
			await adminVoucherApi.updateVoucher(voucher.voucherId, payload);
			toast.success(`Đã ${!detail.isActive ? "kích hoạt" : "tắt"} mã ${detail.code}`);
			await loadVouchers();
		} catch (err) {
			console.error("Failed to toggle status", err);
			toast.error("Không thể chuyển đổi trạng thái hoạt động.");
		}
	};

	const isExpired = (endDateStr: string) => {
		return new Date(endDateStr) < new Date();
	};

	const getVoucherTypeLabel = (code: string) => {
		if (code.toUpperCase().includes("FREESHIP")) {
			return <span className="admin-status admin-status--info">🚚 Freeship</span>;
		}
		return <span className="admin-status admin-status--success">🎟️ Giảm giá %</span>;
	};

	return (
		<section className="admin-orders-page admin-products-page">
			<div className="admin-dashboard__heading">
				<div>
					<p>Cấu hình khuyến mãi hệ thống</p>
					<h1 style={{ margin: 0 }}>Quản lý Vouchers</h1>
				</div>
				<button
					className="admin-refresh-button"
					type="button"
					onClick={() => void loadVouchers()}
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

			<section className="admin-stat-grid" aria-label="Thống kê vouchers">
				<article className="admin-stat-card">
					<div>
						<p>Tổng số mã</p>
						<strong>{vouchers?.totalRecords ?? 0}</strong>
						<span>Vouchers trong hệ thống</span>
					</div>
				</article>
				<article className="admin-stat-card">
					<div>
						<p>Mã đang chạy</p>
						<strong>{vouchers?.data.filter(v => v.isActive && !isExpired(v.endDate)).length ?? 0}</strong>
						<span>Có hiệu lực ngay lúc này</span>
					</div>
				</article>
				<article className="admin-stat-card">
					<div>
						<p>Đã hết lượt dùng</p>
						<strong>{vouchers?.data.filter(v => v.usedCount >= v.usageLimit).length ?? 0}</strong>
						<span>Đạt giới hạn sử dụng</span>
					</div>
				</article>
				<article className="admin-stat-card">
					<div>
						<p>Trang số</p>
						<strong>
							{vouchers?.pageNumber ?? pageNumber}/{vouchers?.totalPages ?? 1}
						</strong>
						<span>Xem kích thước trang {pageSize}</span>
					</div>
				</article>
			</section>

			<div className="admin-orders-grid admin-products-grid">
				{/* List Panel */}
				<section className="admin-panel admin-orders-carousel">
					<div className="admin-panel__header admin-orders-toolbar">
						<div>
							<h2>Danh sách mã Voucher</h2>
							<span>Tạo mới mã giảm giá hoặc mã miễn phí vận chuyển</span>
						</div>
						<button
							className="admin-refresh-button"
							type="button"
							onClick={startCreate}
						>
							Tạo Voucher mới
						</button>
					</div>

					<div className="admin-orders-controls admin-products-filters">
						<label>
							Tìm kiếm mã
							<input
								type="search"
								value={codeFilter}
								onChange={(event) => {
									setPageNumber(1);
									setCodeFilter(event.target.value);
								}}
								placeholder="Nhập mã cần tìm..."
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
								<option value="active">Đang hoạt động</option>
								<option value="inactive">Tạm ngưng</option>
							</select>
						</label>
						<label>
							Loại voucher
							<select
								value={typeFilter}
								onChange={(event) => {
									setPageNumber(1);
									setTypeFilter(event.target.value as "all" | "percent" | "freeship");
								}}
							>
								<option value="all">Tất cả</option>
								<option value="percent">🎟️ Giảm giá %</option>
								<option value="freeship">🚚 Miễn phí vận chuyển</option>
							</select>
						</label>
						<label>
							Kích thước trang
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
						<div className="admin-empty-state">Đang tải danh sách mã khuyến mãi...</div>
					) : vouchers && vouchers.data.length > 0 ? (() => {
						const filteredData = typeFilter === "all"
							? vouchers.data
							: typeFilter === "freeship"
								? vouchers.data.filter(v => v.code.toUpperCase().includes("FREESHIP"))
								: vouchers.data.filter(v => !v.code.toUpperCase().includes("FREESHIP"));
						return filteredData.length > 0 ? (
						<div className="admin-table-wrap">
							<table className="admin-table admin-vouchers-table">
								<thead>
									<tr>
										<th>Mã Code</th>
										<th>Loại Voucher</th>
										<th>Giá trị giảm</th>
										<th>Đơn tối thiểu</th>
										<th>Lượt sử dụng</th>
										<th>Thời gian</th>
										<th>Trạng thái</th>
										<th>Thao tác</th>
									</tr>
								</thead>
								<tbody>
									{filteredData.map((voucher) => {
										const hasExpired = isExpired(voucher.endDate);
										const isFree = voucher.code.toUpperCase().includes("FREESHIP");
										
										return (
											<tr key={voucher.voucherId}>
												<td>
													<strong className="text-indigo-600">{voucher.code}</strong>
													<span>ID: #{voucher.voucherId}</span>
												</td>
												<td>{getVoucherTypeLabel(voucher.code)}</td>
												<td>
													{isFree ? (
														<strong>Freeship (30.000đ)</strong>
													) : (
														<div>
															<strong>{Number(voucher.discountPercent)}%</strong>
															<span>Tối đa {formatCurrency(30000)}</span>
														</div>
													)}
												</td>
												<td>
													<strong>{formatCurrency(voucher.minOrderAmount)}</strong>
												</td>
												<td>
													<div className="flex flex-col">
														<strong>{voucher.usedCount} / {voucher.usageLimit}</strong>
														<div className="w-16 bg-gray-100 rounded-full h-1.5 mt-1 overflow-hidden">
															<div 
																className="bg-indigo-600 h-1.5" 
																style={{ width: `${Math.min(100, (voucher.usedCount / voucher.usageLimit) * 100)}%` }}
															/>
														</div>
													</div>
												</td>
												<td>
													<span>Từ: {formatDate(voucher.startDate)}</span>
													<span>Đến: {formatDate(voucher.endDate)}</span>
												</td>
												<td>
													<button
														type="button"
														onClick={() => void toggleVoucherActive(voucher)}
														className="border-0 bg-transparent p-0 cursor-pointer"
													>
														{hasExpired ? (
															<span className="admin-status admin-status--danger">Hết hạn</span>
														) : voucher.isActive ? (
															<span className="admin-status admin-status--success">Đang bật</span>
														) : (
															<span className="admin-status admin-status--warning">Tắt</span>
														)}
													</button>
												</td>
												<td>
													<div className="admin-row-actions" style={{ display: 'flex', gap: '8px' }}>
														<button
															type="button"
															onClick={() => void openVoucher(voucher.voucherId)}
															className="admin-detail-link"
															style={{ border: 'none', cursor: 'pointer' }}
														>
															Sửa
														</button>
														<button
															type="button"
															onClick={() => void deleteVoucher(voucher.voucherId, voucher.code)}
															className="admin-status admin-status--danger"
															style={{ border: 'none', padding: '9px 12px', cursor: 'pointer', borderRadius: '8px', fontSize: '13px', fontWeight: '800' }}
														>
															Xoá
														</button>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					) : (
						<div className="admin-empty-state">
							Không tìm thấy mã voucher loại "{typeFilter === "freeship" ? "Miễn phí vận chuyển" : "Giảm giá %"}" phù hợp.
						</div>
					);
					})() : (
						<div className="admin-empty-state">
							Không tìm thấy mã voucher phù hợp trong hệ thống.
						</div>
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
									vouchers ? Math.min(vouchers.totalPages || 1, current + 1) : current + 1
								)
							}
							disabled={
								loading || (!!vouchers?.totalPages && pageNumber >= vouchers.totalPages)
							}
						>
							Trang sau
						</button>
					</div>
				</section>

				{/* Detail/Editor Sidebar */}
				<aside className="admin-orders-side">
					<section className="admin-panel">
						<h2>{selectedVoucher ? "Cập nhật Voucher" : "Tạo Voucher mới"}</h2>
						{detailLoading ? (
							<div className="admin-empty-state">Đang tải thông tin chi tiết...</div>
						) : null}

						<div className="admin-product-form">
							{/* Switch type */}
							<label className="admin-product-form__wide">
								Loại mã khuyến mãi
								<select
									value={voucherType}
									onChange={(e) => {
										const val = e.target.value as "percent" | "freeship";
										setVoucherType(val);
										if (val === "freeship") {
											// Default Freeship properties to pass backend validation cleanly
											setForm(prev => ({
												...prev,
												discountPercent: 10,
												maxDiscount: 30000
											}));
										}
									}}
									disabled={!!selectedVoucher}
								>
									<option value="percent">🎟️ Giảm giá %</option>
									<option value="freeship">🚚 Miễn phí vận chuyển (Freeship)</option>
								</select>
							</label>

							{/* Code input */}
							{voucherType === "freeship" ? (
								<label className="admin-product-form__wide">
									Mã Freeship (Tiền tố FREESHIP- được tự động thêm)
									<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<span style={{ fontWeight: 800, color: 'var(--admin-primary)', fontSize: '15px' }}>FREESHIP-</span>
										<input
											style={{ flex: 1 }}
											type="text"
											maxLength={11} // Enforce total length < 20
											value={userCodeSuffix}
											onChange={(e) => setUserCodeSuffix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
											placeholder="VD: HOT2026, SUMMER"
										/>
									</div>
									<span className="admin-form-hint" style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
										Mã đầy đủ sẽ là: <strong>{finalCode}</strong>
									</span>
								</label>
							) : (
								<label className="admin-product-form__wide">
									Mã giảm giá (Nhập ký tự hoa, số)
									<input
										type="text"
										maxLength={20}
										value={form.code}
										onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") }))}
										placeholder="VD: ALMA20, RETRO10"
									/>
									<span className="admin-form-hint" style={{ fontSize: '11px', color: 'var(--admin-muted)' }}>
										Mã đầy đủ sẽ là: <strong>{finalCode || "CHƯA NHẬP"}</strong>
									</span>
								</label>
							)}

							{/* Percentage Fields */}
							{voucherType === "percent" && (
								<>
									<label>
										Tỉ lệ giảm (%) — tối đa 100%
										<input
											type="number"
											min={1}
											max={100}
											value={form.discountPercent}
											onChange={(e) => setForm(prev => ({ ...prev, discountPercent: Math.min(100, Math.max(0, Number(e.target.value))) }))}
										/>
									</label>
									<label>
										Giảm tối đa (đ)
										<input
											type="number"
											min={1000}
											max={50000000}
											value={form.maxDiscount}
											onChange={(e) => setForm(prev => ({ ...prev, maxDiscount: Number(e.target.value) }))}
										/>
									</label>
								</>
							)}

							{/* Universal Fields */}
							<label>
								Đơn hàng tối thiểu (VND)
								<input
									type="number"
									min={0}
									value={form.minOrderAmount}
									onChange={(e) => setForm(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
								/>
							</label>

							<label>
								Số lượt sử dụng tối đa
								<input
									type="number"
									min={1}
									value={form.usageLimit}
									onChange={(e) => setForm(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
								/>
							</label>

							<label>
								Ngày bắt đầu hiệu lực
								<input
									type="date"
									value={toInputDate(form.startDate)}
									onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value + "T00:00:00Z" }))}
								/>
							</label>

							<label>
								Ngày hết hạn khuyến mãi
								<input
									type="date"
									value={toInputDate(form.endDate)}
									onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value + "T23:59:59Z" }))}
								/>
							</label>

							<label className="admin-product-checkbox admin-product-form__wide" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
								<input
									type="checkbox"
									checked={form.isActive}
									onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
								/>
								<span>Kích hoạt sử dụng ngay lập tức</span>
							</label>

							{/* Actions */}
							<div className="admin-status-form admin-product-form__wide" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
								<button
									style={{ flex: 1, padding: '12px', border: 'none', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
									type="button"
									onClick={() => void submitForm()}
									disabled={saving}
								>
									{saving ? "Đang xử lý..." : selectedVoucher ? "Cập nhật Voucher" : "Tạo Voucher mới"}
								</button>
								
								{selectedVoucher && (
									<button
										style={{ padding: '12px', border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', borderRadius: '10px', fontWeight: 800, cursor: 'pointer' }}
										type="button"
										onClick={startCreate}
									>
										Huỷ bỏ
									</button>
								)}
							</div>
						</div>
					</section>
				</aside>
			</div>
		</section>
	);
}

export default AdminVoucherPage;
