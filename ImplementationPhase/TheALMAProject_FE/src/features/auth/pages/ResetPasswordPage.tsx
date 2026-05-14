import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import authApi from '../api/authApi';
import '../styles/auth.css';

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate parameters
  useEffect(() => {
    if (!emailParam || !tokenParam) {
      setError('Đường dẫn không hợp lệ hoặc đã hết hạn.');
    }
  }, [emailParam, tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setError(''); setLoading(true);
    try {
      await authApi.resetPassword({
        email: emailParam,
        resetToken: tokenParam,
        newPassword: password
      });
      toast.success('Mật khẩu đã được thay đổi thành công!');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra, có thể mã xác thực đã hết hạn. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading={<>Mật khẩu mới<br /><span>Bảo mật hơn</span></>}
      subheading="Vui lòng tạo một mật khẩu mới đủ mạnh để bảo vệ tài khoản của bạn."
    >
      <div className="auth-card__header">
        <h1 className="auth-card__title">Đặt Lại Mật Khẩu</h1>
        <p className="auth-card__sub">Dành cho {emailParam}</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {emailParam && tokenParam ? (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <span className="form-icon"><LockIcon /></span>
            <input
              className="form-input"
              type="password"
              placeholder="Mật khẩu mới"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <span className="form-icon"><LockIcon /></span>
            <input
              className="form-input"
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : <><span>Lưu mật khẩu mới</span><ArrowRightIcon /></>}
          </button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
          <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-flex' }}>
            Gửi lại link xác nhận
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
