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

function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Toaster
					position="top-right"
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
          <Route path="/cart"            element={
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', paddingBottom: '40px' }}>
              <CartPage />
            </div>
          } />

          {/* Design route */}
          <Route path="/customizer"      element={<CustomizerPage />} />

          {/* Existing routes */}
          <Route path="/orders"          element={
            <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '20px' }}>
              <OrderListPage />
            </div>
          } />

					{/* Existing routes */}
					<Route
						path="/orders"
						element={
							<div
								style={{
									backgroundColor: "#f5f5f5",
									minHeight: "100vh",
									padding: "20px",
								}}
							>
								<OrderListPage />
							</div>
						}
					/>

					{/* Default redirect */}
					<Route path="/" element={<HomePage />} />
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
