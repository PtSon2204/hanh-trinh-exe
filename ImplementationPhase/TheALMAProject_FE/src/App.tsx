
import { Toaster } from "react-hot-toast";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoutes } from "./features/admin/routes/adminRoutes";
import {
	AuthProvider,
	ForgotPasswordPage,
	LoginPage,
	ProfilePage,
	RegisterPage,
	ResetPasswordPage,
} from "./features/auth";
import ErrorPage from "./features/error/pages/ErrorPage";
import HomePage from "./features/home/pages/HomePage";
import OrderListPage from "./features/orders/pages/OrderListPage";
import OrderDetailPage from "./features/orders/pages/OrderDetailPage";
import { ProductListPage, ProductDetailPage } from './features/products';
import CartPage from './features/cart/pages/CartPage';
import CustomizerPage from './features/customizer/pages/CustomizerPage';
import CheckoutPage from "./features/checkout/pages/CheckoutPage";
import MyDesignsPage from "./features/user-designs/pages/MyDesignsPage";
import PrivateRoute from "./shared/components/PrivateRoute";
import ContactPage from "./features/contact/pages/ContactPage";
import ZaloPage from "./features/zalo/pages/ZaloPage";
import ZaloFloat from "./shared/components/ZaloFloat";
import StoryPage from "./features/story/pages/StoryPage";
import { useLocation } from "react-router-dom";

// Chỉ hiện ZaloFloat khi KHÔNG phải trang /zalo
function ZaloFloatWrapper() {
  const { pathname } = useLocation();
  if (pathname === "/zalo") return null;
  return <ZaloFloat />;
}

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Toaster
					position="top-right"
					containerStyle={{ zIndex: 99999 }}
					toastOptions={{
						style: {
							fontFamily: "'Outfit', sans-serif",
							borderRadius: "12px",
							boxShadow: "0 8px 30px -8px rgba(0,0,0,0.15)",
							fontSize: "0.875rem",
						},
						success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
						error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
					}}
				/>

				<Routes>
					{/* Admin Routes */}
					<Route path="/admin/*" element={<AdminRoutes />} />

					{/* Auth routes */}
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
					<Route path="/profile" element={<ProfilePage />} />
					<Route path="/error" element={<ErrorPage />} />
					{/* Cart route */}
					<Route path="/cart" element={<CartPage />} />

					{/* Design route */}
					<Route path="/customizer" element={<CustomizerPage />} />

					{/* Contact */}
					<Route path="/contact" element={<ContactPage />} />

					{/* Story */}
					<Route path="/Story" element={<StoryPage />} />

					{/* Zalo OA */}
					<Route path="/zalo" element={<ZaloPage />} />

					{/* Shopping & Product Discovery (UC-08, UC-09) */}
					<Route path="/category" element={<ProductListPage />} />
					<Route path="/products/:id" element={<ProductDetailPage />} />

					{/* Protected routes - yêu cầu đăng nhập */}
					<Route path="/orders" element={
						<PrivateRoute>
							<OrderListPage />
						</PrivateRoute>
					} />

					<Route path="/orders/:id" element={
						<PrivateRoute>
							<OrderDetailPage />
						</PrivateRoute>
					} />

					<Route path="/checkout" element={
						<PrivateRoute>
							<CheckoutPage />
						</PrivateRoute>
					} />

					<Route path="/my-designs" element={
						<PrivateRoute>
							<MyDesignsPage />
						</PrivateRoute>
					} />

					{/* Default redirect */}
					<Route path="/" element={<HomePage />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
				{/* Floating Zalo button — hiển thị trên tất cả trang trừ /zalo */}
				<ZaloFloatWrapper />
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
