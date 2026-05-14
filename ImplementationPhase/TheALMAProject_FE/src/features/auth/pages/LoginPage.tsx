import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import authApi from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import type { AuthResponse } from '../../../shared/types/auth.types';
import '../styles/auth.css';

// ── Icons ────────────────────────────────────────────────────────────
const EnvelopeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const data = res.data as AuthResponse;
      login({ token: data.token, email: data.email, fullName: data.fullName, role: data.role });
      toast.success(`Chào mừng, ${data.fullName}!`);
      navigate('/');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Email hoặc mật khẩu không đúng.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    toast('Chức năng đăng nhập Google đang được tích hợp...', { icon: '🔗' });
  };
  const handleFacebookLogin = () => {
    toast('Chức năng đăng nhập Facebook đang được tích hợp...', { icon: '🔗' });
  };

  return (
    <AuthLayout>
      <div className="auth-card__header">
        <h1 className="auth-card__title">Chào mừng trở lại</h1>
        <p className="auth-card__sub">Đăng nhập để tiếp tục sáng tạo</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Email */}
        <div className="form-group">
          <span className="form-icon"><EnvelopeIcon /></span>
          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="form-group">
          <span className="form-icon"><LockIcon /></span>
          <input
            id="login-password"
            className="form-input form-input--pr"
            type={showPw ? 'text' : 'password'}
            placeholder="Mật khẩu"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <span className="form-input-action">
            <button
              type="button"
              className="toggle-pw"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
        </div>

        {/* Forgot link */}
        <div style={{ textAlign: 'right', marginTop: '-.25rem' }}>
          <Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link>
        </div>

        {/* Submit */}
        <button id="login-submit" type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : (
            <><span>Đăng nhập</span><ArrowRightIcon /></>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="auth-divider">
        <div className="auth-divider__line" />
        <span className="auth-divider__text">hoặc đăng nhập với</span>
        <div className="auth-divider__line" />
      </div>

      {/* Social */}
      <div className="social-grid">
        <button id="login-google" type="button" className="btn-outline" onClick={handleGoogleLogin}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
          <span>Google</span>
        </button>
        <button id="login-facebook" type="button" className="btn-outline" onClick={handleFacebookLogin}>
          <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
          <span>Facebook</span>
        </button>
      </div>

      {/* Footer */}
      <p className="auth-footer-text">
        Chưa có tài khoản?{' '}
        <Link to="/register">Tạo ngay</Link>
      </p>
    </AuthLayout>
  );
}
