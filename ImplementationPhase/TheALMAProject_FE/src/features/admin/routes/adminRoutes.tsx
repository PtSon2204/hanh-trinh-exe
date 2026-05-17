import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../../auth";
import { AdminDashboardPage } from "../dashboard/pages/AdminDashboardPage";
import { AdminLayout } from "../orders/components/AdminLayout";
import AdminOrdersPage from "../orders/pages/adminOrdersPage";
import { AdminProductLayout } from "../products/components/AdminProductLayout";
import AdminBaseProductsPage from "../products/pages/AdminBaseProductsPage";
import AdminStoreProductsPage from "../products/pages/AdminStoreProductsPage";

const ADMIN_ROLES = new Set(["Admin", "Product Manager"]);

function AdminGuard({ children }: { children: ReactNode }) {
	const { user } = useAuth();
	const location = useLocation();

	if (!user || !ADMIN_ROLES.has(user.role)) {
		return (
			<Navigate
				replace
				to="/error"
				state={{
					from: location.pathname,
					message: user
						? "Tài khoản hiện tại không có quyền quản trị sản phẩm."
						: "Bạn cần đăng nhập bằng tài khoản quản trị viên hoặc Product Manager để truy cập trang admin.",
					title: "Không thể truy cập trang quản trị",
				}}
			/>
		);
	}

	return <>{children}</>;
}

export function AdminRoutes() {
	return (
		<AdminGuard>
			<Routes>
				<Route index element={<AdminDashboardPage />} />
				<Route
					path="orders"
					element={
						<AdminLayout>
							<AdminOrdersPage />
						</AdminLayout>
					}
				/>
				<Route
					path="base-products"
					element={
						<AdminProductLayout activePath="/admin/base-products">
							<AdminBaseProductsPage />
						</AdminProductLayout>
					}
				/>
				<Route
					path="products"
					element={
						<AdminProductLayout activePath="/admin/products">
							<AdminStoreProductsPage />
						</AdminProductLayout>
					}
				/>
				<Route path="*" element={<Navigate to="/admin" replace />} />
			</Routes>
		</AdminGuard>
	);
}
