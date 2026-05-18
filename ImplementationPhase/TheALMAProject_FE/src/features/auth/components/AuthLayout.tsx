import React from 'react';
import { Link } from 'react-router-dom';


const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Tagline shown on left panel */
  heading?: React.ReactNode;
  subheading?: string;
}

export default function AuthLayout({
  children,
  heading = (
    <>
      Thế giới đồng phục<br />
      <span>Dành riêng cho bạn</span>
    </>
  ),
  subheading = 'Tự tay sáng tạo áo thiết kế riêng với công cụ trực tuyến, hoặc mua ngay các mẫu áo trường cực đẹp đã được thiết kế sẵn.',
}: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* ── Left branding panel ─────────────────────────────── */}
      <div className="auth-left">
        <div className="auth-left__bg-image">
          <img src="/images/hero-bg.png" alt="Background" />
        </div>
        <div className="auth-left__dots" />
        <div className="auth-left__blob auth-left__blob--blue" />
        <div className="auth-left__blob auth-left__blob--purple" />

        <div className="auth-left__content">
          <Link to="/" className="auth-left__logo">
            <img src="/images/logo.png" alt="ALMA Logo" className="h-12 w-auto object-contain bg-white rounded-lg p-1.5 shadow-md mr-3" />
            <span className="auth-left__logo-text">
              ALMA Custom Threads<span className="auth-left__logo-dot">.</span>
            </span>
          </Link>

          <h2 className="auth-left__heading">{heading}</h2>
          <p className="auth-left__sub">{subheading}</p>

          <div className="auth-left__stats">
            <div className="auth-stat">
              <div className="auth-stat__value">500+</div>
              <div className="auth-stat__label">Trường đối tác</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat__value">10K+</div>
              <div className="auth-stat__label">Áo đã in</div>
            </div>
            <div className="auth-stat">
              <div className="auth-stat__value">100+</div>
              <div className="auth-stat__label">Mẫu phôi sẵn</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-right__glow auth-right__glow--top" />
        <div className="auth-right__glow auth-right__glow--bottom" />

        <div className="auth-form-wrapper">
          <div className="auth-card">
            <div className="auth-card__top-bar" />

            {/* Logo inside card */}
            <div className="auth-card__logo">
              <Link to="/">
                <img src="/images/logo.png" alt="ALMA Logo" className="h-14 w-auto object-contain" />
              </Link>
            </div>

            {children}
          </div>

          {/* Back link */}
          <div className="auth-back">
            <Link to="/">
              <div className="auth-back__icon">
                <ArrowLeftIcon />
              </div>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
