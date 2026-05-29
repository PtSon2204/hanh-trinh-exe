import { Link } from 'react-router-dom';
import '../../features/home/pages/HomePage.css';

export default function Footer() {
  return (
    <footer className="alma-footer mt-auto">
      <div className="alma-footer__inner">
        <div className="alma-footer__brand">
          <Link to="/" className="alma-footer__logo-link">
            <img src="/images/logo.png" alt="ALMA" className="alma-footer__logo-img" />
            <span className="alma-footer__logo-text">ALMA<span>.</span></span>
          </Link>
          <p className="alma-footer__tagline">Nền tảng thiết kế đồng phục hàng đầu dành cho học sinh, sinh viên. Chạm tay vào phong cách, sáng tạo chất riêng của bạn.</p>
        </div>
        <div className="alma-footer__contact">
          <h3 className="alma-footer__heading">Liên Hệ</h3>
          <p>📍 Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</p>
          <p>📞 <a href="tel:0123456789">0123 456 789</a></p>
          <p>✉️ <a href="mailto:contact@almacustom.vn">contact@almacustom.vn</a></p>
        </div>
        <div className="alma-footer__social">
          <h3 className="alma-footer__heading">Kết Nối</h3>
          <div className="alma-footer__socials">
            <a href="https://facebook.com" className="alma-footer__social-btn" aria-label="Facebook">f</a>
            <a href="https://instagram.com" className="alma-footer__social-btn" aria-label="Instagram">📷</a>
            <a href="https://www.tiktok.com" className="alma-footer__social-btn" aria-label="TikTok">♪</a>
          </div>
        </div>
      </div>
      <div className="alma-footer__bottom">
        <p>© 2026 ALMA Custom Threads. All rights reserved.</p>
        <div className="alma-footer__links">
          <Link to="/privacy">Chính sách bảo mật</Link>
          <Link to="/terms">Điều khoản dịch vụ</Link>
        </div>
      </div>
    </footer>
  );
}
