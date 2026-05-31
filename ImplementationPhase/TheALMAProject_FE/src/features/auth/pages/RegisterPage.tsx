import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import authApi from '../api/authApi';
import '../styles/auth.css';

// ── Icons ────────────────────────────────────────────────────────────
const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.49 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 1.1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.43a16 16 0 0 0 5.66 5.66l1.79-1.79a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
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

// ── Password validation helpers ─────────────────────────────────────
function getPasswordErrors(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8)            errors.push('ít nhất 8 ký tự');
  if (!/[A-Z]/.test(pw))        errors.push('ít nhất 1 chữ in hoa');
  if (!/[a-z]/.test(pw))        errors.push('ít nhất 1 chữ thường');
  if (!/[0-9]/.test(pw))        errors.push('ít nhất 1 chữ số');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('ít nhất 1 ký tự đặc biệt (!@#$...)');
  return errors;
}

// ── Password strength ────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))          score++;
  if (/[a-z]/.test(pw))          score++;
  if (/[0-9]/.test(pw))          score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;
  const map = [
    { label: '', color: '#e2e8f0' },
    { label: 'Rất yếu', color: '#ef4444' },
    { label: 'Yếu', color: '#f97316' },
    { label: 'Trung bình', color: '#f59e0b' },
    { label: 'Khá', color: '#3b82f6' },
    { label: 'Mạnh', color: '#22c55e' },
  ];
  return { score, ...map[score] };
}

// ── OTP Step ─────────────────────────────────────────────────────────
interface OtpStepProps {
  email: string;
  onSuccess: () => void;
}

function OtpStep({ email, onSuccess }: OtpStepProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = [...otp];
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleResend = async () => {
    try {
      await authApi.resendOtp(email);
      setCountdown(60);
      toast.success('Đã gửi lại mã OTP!');
    } catch {
      toast.error('Gửi lại thất bại, thử lại sau.');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Vui lòng nhập đủ 6 chữ số.'); return; }
    setError(''); setLoading(true);
    try {
      await authApi.verifyOtp({ email, otpCode: code });
      toast.success('Xác thực thành công! Hãy đăng nhập.');
      onSuccess();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Mã OTP không đúng hoặc đã hết hạn.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-card__header">
        <h1 className="auth-card__title">Xác thực email</h1>
        <p className="auth-card__sub">Nhập mã 6 chữ số đã gửi đến<br /><strong>{email}</strong></p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="auth-form" onSubmit={handleVerify}>
        <div className="otp-row" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              id={`otp-digit-${i}`}
              className="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
            />
          ))}
        </div>

        <button id="otp-submit" type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '.5rem' }}>
          {loading ? <span className="spinner" /> : <><span>Xác nhận</span><ArrowRightIcon /></>}
        </button>
      </form>

      <div className="resend-row">
        {countdown > 0
          ? `Gửi lại sau ${countdown}s`
          : <><span>Không nhận được mã? </span><button onClick={handleResend}>Gửi lại</button></>
        }
      </div>
    </>
  );
}

// ── Main Register Page ────────────────────────────────────────────────
export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = getStrength(form.password);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate mật khẩu khớp với backend FluentValidation
    const pwErrors = getPasswordErrors(form.password);
    if (pwErrors.length > 0) {
      setError(`Mật khẩu phải có: ${pwErrors.join(', ')}.`);
      return;
    }
    if (form.password !== form.confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }

    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone || undefined,
      });
      setRegisteredEmail(form.email);
      toast.success('Đã gửi mã OTP đến email!');
      setStep('otp');
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const data = apiErr?.response?.data;
      // FluentValidation trả errors object với nhiều field
      if (data?.errors) {
        const allErrors = Object.values(data.errors).flat().join(' ');
        setError(allErrors);
      } else {
        setError(data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <AuthLayout
        heading={<>Xác thực<br /><span>Tài khoản của bạn</span></>}
        subheading="Chúng tôi đã gửi mã xác thực đến email của bạn. Hãy kiểm tra hộp thư đến (và thư mục spam)."
      >
        <div className="step-indicator">
          <div className="step-dot" />
          <div className="step-dot active" />
        </div>
        <OtpStep email={registeredEmail} onSuccess={() => navigate('/login')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading={<>Tạo tài khoản<br /><span>Miễn phí & nhanh chóng</span></>}
      subheading="Đăng ký để bắt đầu hành trình thiết kế đồng phục cùng ALMA Custom Threads."
    >
      <div className="step-indicator">
        <div className="step-dot active" />
        <div className="step-dot" />
      </div>

      <div className="auth-card__header">
        <h1 className="auth-card__title">Tạo tài khoản</h1>
        <p className="auth-card__sub">Điền thông tin để bắt đầu</p>
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Full name */}
        <div className="form-group">
          <span className="form-icon"><UserIcon /></span>
          <input id="reg-fullname" className="form-input" type="text" placeholder="Họ và tên" value={form.fullName} onChange={handleChange('fullName')} required autoComplete="name" />
        </div>

        {/* Email */}
        <div className="form-group">
          <span className="form-icon"><EnvelopeIcon /></span>
          <input id="reg-email" className="form-input" type="email" placeholder="Email của bạn" value={form.email} onChange={handleChange('email')} required autoComplete="email" />
        </div>

        {/* Phone (optional) */}
        <div className="form-group">
          <span className="form-icon"><PhoneIcon /></span>
          <input id="reg-phone" className="form-input" type="tel" placeholder="Số điện thoại (không bắt buộc)" value={form.phone} onChange={handleChange('phone')} autoComplete="tel" />
        </div>

        {/* Password */}
        <div className="form-group">
          <span className="form-icon"><LockIcon /></span>
          <input
            id="reg-password"
            className="form-input form-input--pr"
            type={showPw ? 'text' : 'password'}
            placeholder="Mật khẩu (≥ 8 ký tự, hoa, số, ký tự đặc biệt)"
            value={form.password}
            onChange={handleChange('password')}
            required
            autoComplete="new-password"
          />
          <span className="form-input-action">
            <button type="button" className="toggle-pw" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </span>
        </div>

        {/* Password strength + hints */}
        {form.password && (
          <div className="pw-strength">
            <div className="pw-strength__bar">
              <div className="pw-strength__fill" style={{ width: `${(strength.score / 5) * 100}%`, background: strength.color }} />
            </div>
            <span className="pw-strength__label" style={{ color: strength.color }}>{strength.label}</span>
          </div>
        )}
        {form.password && getPasswordErrors(form.password).length > 0 && (
          <ul className="pw-hints">
            {getPasswordErrors(form.password).map((hint, i) => (
              <li key={i} className="pw-hint-item">✗ {hint}</li>
            ))}
          </ul>
        )}

        {/* Confirm */}
        <div className="form-group">
          <span className="form-icon"><LockIcon /></span>
          <input id="reg-confirm" className="form-input" type="password" placeholder="Xác nhận mật khẩu" value={form.confirm} onChange={handleChange('confirm')} required autoComplete="new-password" />
        </div>

        <button id="reg-submit" type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : <><span>Đăng ký</span><ArrowRightIcon /></>}
        </button>
      </form>

      <p className="auth-footer-text">
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </AuthLayout>
  );
}
