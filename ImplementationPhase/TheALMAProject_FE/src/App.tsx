import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './features/auth';
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage } from './features/auth';
import OrderListPage from './features/orders/pages/OrderListPage';
import HomePage from './features/home/pages/HomePage';
import CartPage from './features/cart/pages/CartPage';
import CustomizerPage from './features/customizer/pages/CustomizerPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'Outfit', sans-serif",
              borderRadius: '12px',
              boxShadow: '0 8px 30px -8px rgba(0,0,0,0.15)',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Auth routes */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/profile"         element={<ProfilePage />} />

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

          {/* Default redirect */}
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;