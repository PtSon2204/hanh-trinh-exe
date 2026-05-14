import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import authApi from '../api/authApi';
import '../styles/auth.css';

const EnvelopeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#22c55e' }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
      toast.success('Đã gửi link đặt lại mật khẩu!');
    } catch (err: unknown) {
      // API luôn trả success (bảo mật), nên chỉ hiện lỗi network
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (!status) {
        setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
      } else {
        setSent(true); // treat all API responses as success per backend design
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading={<>Quên mật khẩu?<br /><span>Đừng lo, ta xử lý được</span></>}
      subheading="Nhập email đăng ký của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu ngay lập tức."
    >
      {sent ? (
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <CheckCircleIcon />
          </div>
          <h2 className="auth-card__title" style={{ marginBottom: '.5rem' }}>Email đã được gửi!</h2>
          <p className="auth-card__sub" style={{ marginBottom: '1.5rem' }}>
            Nếu email <strong>{email}</strong> tồn tại trong hệ thống,<br />bạn sẽ nhận được link đặt lại mật khẩu.
          </p>
          <div className="alert alert--info" style={{ textAlign:'left' }}>
            Kiểm tra cả thư mục <strong>Spam / Junk</strong> nếu không thấy email.
          </div>
          <p className="auth-footer-text" style={{ marginTop: '1.25rem' }}>
            <Link to="/login">← Quay về đăng nhập</Link>
          </p>
        </div>
      ) : (
        <>
          <div className="auth-card__header">
            <h1 className="auth-card__title">Quên mật khẩu</h1>
            <p className="auth-card__sub">Nhập email để nhận link đặt lại</p>
          </div>

          {error && <div className="alert alert--error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <span className="form-icon"><EnvelopeIcon /></span>
              <input
                id="forgot-email"
                className="form-input"
                type="email"
                placeholder="Email đã đăng ký"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <button id="forgot-submit" type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><span>Gửi link đặt lại</span><ArrowRightIcon /></>}
            </button>
          </form>

          <p className="auth-footer-text">
            Nhớ ra mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
          </p>
        </>
      )}
    </AuthLayout>
  );
}
