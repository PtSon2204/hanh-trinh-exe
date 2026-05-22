import { Link } from "react-router-dom";
import "./ZaloPage.css";

export default function ZaloPage() {
  const ZALO_LINK = "https://zalo.me/0123456789"; // ← thay bằng link Zalo OA thật của bạn

  return (
    <div className="zoa-root">
      {/* ── Top bar giống Zalo ── */}
      <header className="zoa-topbar">
        <div className="zoa-topbar__inner">
          <div className="zoa-topbar__logo">
            <svg viewBox="0 0 80 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="zoa-topbar__zalo-svg">
              <text x="0" y="22" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="26" fill="#0068FF">Zalo</text>
            </svg>
          </div>
          <div className="zoa-topbar__lang">
            🌐 Ngôn ngữ: <span>Tiếng Việt</span> ▾
          </div>
        </div>
      </header>

      {/* ── Main card ── */}
      <main className="zoa-main">
        <div className="zoa-card">
          {/* Left: Info */}
          <div className="zoa-card__left">
            {/* Avatar + Name */}
            <div className="zoa-profile">
              <div className="zoa-avatar">
                <img src="/images/logo.png" alt="ALMA Logo" />
              </div>
              <div className="zoa-profile__info">
                <h1 className="zoa-name">
                  ALMA Custom Threads
                  <span className="zoa-verified" title="Tài khoản đã xác minh">
                    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#FFCD00"/><path d="M6 10.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </h1>
                <p className="zoa-category">Thời trang &amp; Đồng phục tùy chỉnh</p>
                <a href={ZALO_LINK} target="_blank" rel="noopener noreferrer" className="zoa-msg-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Nhắn tin
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="zoa-divider" />

            {/* Detail info */}
            <div className="zoa-details">
              <h2 className="zoa-details__heading">Thông tin chi tiết</h2>

              <div className="zoa-detail-item">
                <span className="zoa-detail-item__icon">📍</span>
                <a href="https://maps.google.com/?q=Khu+Cong+nghe+cao+Hoa+Lac" target="_blank" rel="noopener noreferrer" className="zoa-detail-item__link">
                  Khu CNC Hòa Lạc, Thạch Thất, Hà Nội
                </a>
              </div>

              <div className="zoa-detail-item">
                <span className="zoa-detail-item__icon">📞</span>
                <a href="tel:0904363736" className="zoa-detail-item__link">0904363736</a>
              </div>

              <div className="zoa-detail-item">
                <span className="zoa-detail-item__icon">⏰</span>
                <span>
                  <span className="zoa-open">Đang mở cửa</span>
                  <span className="zoa-detail-item__muted"> · Đóng cửa lúc 17:30</span>
                </span>
              </div>

              <div className="zoa-detail-item">
                <span className="zoa-detail-item__icon">🌐</span>
                <a href="/" className="zoa-detail-item__link">almacustom.vn</a>
              </div>
            </div>

            {/* Divider */}
            <div className="zoa-divider" />

            {/* Description */}
            <p className="zoa-desc">
              <span className="zoa-desc__brand">ALMA Custom Threads</span> chuyên thiết kế và sản xuất áo đồng phục chất lượng cao theo yêu cầu
              (áo lớp, áo trường, áo sự kiện, áo thun in ấn theo yêu cầu) — giá thành hợp lý,
              giao hàng toàn quốc. Công cụ thiết kế trực tuyến giúp bạn tạo mẫu áo độc đáo chỉ trong vài phút!
            </p>
          </div>

          {/* Right: QR */}
          <div className="zoa-card__right">
            <div className="zoa-qr-box">
              <img src="/images/zalo_qr.jpg" alt="QR Code Zalo ALMA" className="zoa-qr-img" />
              <p className="zoa-qr-caption">
                Mở Zalo, bấm quét QR để quét và<br />xem trên điện thoại
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="zoa-footer">
        <p>© Copyright 2024 Zalo Group. All right Reserved.</p>
        <div className="zoa-footer__back">
          <Link to="/" className="zoa-footer__back-link">← Quay về trang ALMA</Link>
        </div>
      </footer>
    </div>
  );
}
