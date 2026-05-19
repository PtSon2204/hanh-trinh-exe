import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import authApi from "../../auth/api/authApi";
import { useAuth } from "../../auth/context/AuthContext";
import "./HomePage.css";

// ── Navbar ────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    logout();
    toast.success("Đã đăng xuất!");
  };

  return (
    <header className="alma-nav">
      <div className="alma-nav__inner">
        <button
          className="alma-nav__mobile-btn"
          onClick={() => setMobileOpen((o) => !o)}
          type="button"
        >
          <span className="hamburger-icon">{mobileOpen ? "✕" : "☰"}</span>
        </button>

        <Link to="/" className="alma-nav__brand">
          <img
            src="/images/logo.png"
            alt="ALMA Logo"
            className="alma-nav__logo"
          />
          <span className="alma-nav__title">
            ALMA Custom Threads<span className="dot">.</span>
          </span>
        </Link>

        <nav className="alma-nav__links">
          <Link to="/" className="alma-nav__link alma-nav__link--active">
            Trang Chủ
          </Link>
          <Link to="/category" className="alma-nav__link">
            Sản Phẩm
          </Link>
          <Link
            to="/customizer"
            className="alma-nav__link alma-nav__link--design"
          >
            ✨ Thiết Kế Ngay
          </Link>
        </nav>

        <div className="alma-nav__actions">
          <Link
            to="/category"
            className="alma-nav__icon-btn"
            aria-label="Search"
          >
            🔍
          </Link>
          <Link
            to="/cart"
            className="alma-nav__icon-btn alma-nav__cart"
            aria-label="Cart"
          >
            🛒<span className="alma-nav__badge">1</span>
          </Link>
          {user ? (
            <div className="alma-nav__user-menu">
              <Link to="/profile" className="alma-nav__login-btn">
                👤 {user.fullName.split(" ").pop()}
              </Link>
              {user.role === "Admin" && (
                <Link to="/admin" className="alma-nav__logout-btn">
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="alma-nav__logout-btn"
                type="button"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link to="/login" className="alma-nav__login-btn">
              👤 Đăng nhập
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="alma-nav__mobile-menu">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            Trang Chủ
          </Link>
          <Link to="/category" onClick={() => setMobileOpen(false)}>
            Sản Phẩm
          </Link>
          <Link to="/customizer" onClick={() => setMobileOpen(false)}>
            ✨ Thiết Kế Ngay
          </Link>
          {user ? (
            <button
              onClick={() => {
                void handleLogout();
                setMobileOpen(false);
              }}
              type="button"
            >
              Đăng xuất
            </button>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              Đăng nhập
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────
function buildCharSpans(text: string, container: HTMLSpanElement) {
  if (!container) return;
  container.innerHTML = "";

  // Tách chuỗi thành từng TỪ
  const words = text.split(" ");

  words.forEach((word, wordIndex) => {
    // Tạo thẻ span bọc TỪ để tránh bị rớt dòng giữa chừng
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";

    // Tách từ thành từng KÝ TỰ và thêm hiệu ứng
    const chars = word.split("");
    chars.forEach((char) => {
      const span = document.createElement("span");
      span.className = "hero-char";
      span.textContent = char;
      
      // Giữ nguyên hiệu ứng hover của bạn
      span.addEventListener("mouseenter", () => {
        const hue = Math.floor(Math.random() * 360);
        span.style.color = `hsl(${hue},85%,65%)`;
        span.style.textShadow = `0 0 20px hsl(${hue},85%,65%)`;
        span.style.transform = "scale(1.35) translateY(-6px)";
      });
      span.addEventListener("mouseleave", () => {
        span.style.color = "";
        span.style.textShadow = "";
        span.style.transform = "";
      });
      
      wordSpan.appendChild(span);
    });

    container.appendChild(wordSpan);

    // Thêm khoảng trắng giữa các từ
    if (wordIndex < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = "hero-space";
      spaceSpan.innerHTML = "&nbsp;";
      container.appendChild(spaceSpan);
    }
  });
}

function Hero() {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (line1Ref.current)
      buildCharSpans("Đồng phục trường lớp ", line1Ref.current);
    if (line2Ref.current)
      buildCharSpans("thiết kế theo cách của bạn", line2Ref.current);
  }, []);

  return (
    <section className="hero">
      <div className="hero__bg">
        <img src="/images/hero-bg.png" alt="" className="hero__bg-img" />
        <div className="hero__bg-overlay" />
      </div>
      <div className="hero__blob hero__blob--blue" />
      <div className="hero__blob hero__blob--purple" />
      <div className="hero__dots" />

      <div className="hero__content">
        <div className="hero__left">
          <span className="hero__badge">
            <span className="hero__badge-dot" />
            Nền tảng Thiết kế Đồng Phục #1 Hòa Lạc
          </span>

          <h1 className="hero__heading">
            <span ref={line1Ref} />
            <span ref={line2Ref} />
          </h1>

          <p className="hero__desc">
            Tự tay thiết kế áo lớp, áo trường với công cụ trực tuyến — kéo thả
            sticker, thêm chữ, chọn màu & AI hỗ trợ. Từ ý tưởng đến sản phẩm chỉ
            trong vài phút.
          </p>

          <div className="hero__pills">
            {[
              { icon: "👆", label: "Kéo thả Sticker" },
              { icon: "🔤", label: "Thêm chữ & Logo" },
              { icon: "🎨", label: "Chọn màu tùy thích" },
              { icon: "🤖", label: "AI gợi ý thiết kế" },
            ].map((p) => (
              <span key={p.label} className="hero__pill">
                {p.icon} {p.label}
              </span>
            ))}
          </div>

          <div className="hero__cta">
            <Link to="/customizer" className="btn-hero-primary">
              ✨ Thiết kế ngay →
            </Link>
            <Link to="/category" className="btn-hero-secondary">
              👕 Xem mẫu áo
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat">
              <p className="hero__stat-num">500+</p>
              <p className="hero__stat-lbl">Trường đối tác</p>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <p className="hero__stat-num">10K+</p>
              <p className="hero__stat-lbl">Áo đã in</p>
            </div>
            <div className="hero__stat-divider" />
            <div className="hero__stat">
              <p className="hero__stat-num">100+</p>
              <p className="hero__stat-lbl">Mẫu phôi sẵn</p>
            </div>
          </div>
        </div>

        <div className="hero__right">
          <div className="hero__mockup-glow" />
          <div className="hero__mockup">
            <div className="hero__mockup-bar">
              <span className="hero__dot hero__dot--red" />
              <span className="hero__dot hero__dot--yellow" />
              <span className="hero__dot hero__dot--green" />
              <span className="hero__mockup-title">
                ALMA Customizer — Thiết kế trực tuyến
              </span>
            </div>
            <div className="hero__mockup-body">
              <div className="hero__mockup-sidebar">
                {[
                  "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092149.png",
                  "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092143.png",
                  "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092125.png",
                  "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092033.png",
                ].map((src, i) => (
                  <div
                    key={src}
                    className={`hero__thumb ${i === 0 ? "hero__thumb--active" : ""}`}
                  >
                    <img src={src} alt={`Mẫu ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="hero__mockup-canvas">
                <img
                  src="/images/Áo_đã_thiet_ke/1.png"
                  alt="Áo đang thiết kế"
                />
                <div className="hero__mockup-tools">
                  <span>⇔</span>
                  <span>↻</span>
                  <span>⊞</span>
                </div>
              </div>
            </div>
            <div className="hero__mockup-footer">
              <div className="hero__swatches">
                {[
                  "#fff",
                  "#3b82f6",
                  "#1f2937",
                  "#f9a8d4",
                  "#4ade80",
                  "#fde047",
                ].map((c) => (
                  <span
                    key={c}
                    className="hero__swatch"
                    style={{
                      background: c,
                      border: c === "#fff" ? "2px solid #60a5fa" : "none",
                    }}
                  />
                ))}
              </div>
              <div className="hero__mockup-actions">
                <span className="hero__undo">↺ Hoàn tác</span>
                <span className="hero__order">🛒 Đặt hàng</span>
              </div>
            </div>
          </div>

          <div className="hero__badge-float hero__badge-float--top">
            <div
              className="hero__badge-icon"
              style={{ background: "linear-gradient(135deg,#4ade80,#10b981)" }}
            >
              ✓
            </div>
            <div>
              <p className="hero__badge-title">Miễn phí thiết kế</p>
              <p className="hero__badge-sub">Chỉ tính phí in ấn</p>
            </div>
          </div>
          <div className="hero__badge-float hero__badge-float--bottom">
            <div
              className="hero__badge-icon"
              style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}
            >
              ✨
            </div>
            <div>
              <p className="hero__badge-title">AI hỗ trợ thiết kế</p>
              <p className="hero__badge-sub">Tạo họa tiết tự động</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: "👕",
      color: "linear-gradient(135deg,#3b82f6,#2563eb)",
      badge: "Bước 1",
      badge_color: "#dbeafe",
      badge_text: "#2563eb",
      title: "Chọn Phôi Áo",
      desc: "Hơn 100 mẫu phôi từ áo thun, polo, sơ mi đến hoodie. Đa dạng kiểu dáng để bạn lựa chọn.",
    },
    {
      icon: "🎨",
      color: "linear-gradient(135deg,#6366f1,#9333ea)",
      badge: "Bước 2",
      badge_color: "#e0e7ff",
      badge_text: "#4f46e5",
      title: "Tự Thiết Kế Online",
      desc: "Kéo thả sticker, thêm chữ, chọn màu, logo trường. AI hỗ trợ tạo họa tiết độc đáo chỉ bằng mô tả.",
    },
    {
      icon: "🚚",
      color: "linear-gradient(135deg,#22c55e,#059669)",
      badge: "Bước 3",
      badge_color: "#dcfce7",
      badge_text: "#16a34a",
      title: "Đặt Hàng & Nhận Áo",
      desc: "Chọn size cho cả lớp, thanh toán online. Áo được in chất lượng cao và giao tận nơi.",
    },
  ];
  return (
    <section className="section section--white">
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#2563eb" }}>
            Quy Trình Đơn Giản
          </span>
          <h2 className="section__title">3 bước để có áo trường độc nhất</h2>
          <div className="section__divider" />
        </div>
        <div className="how-grid">
          {steps.map((s) => (
            <div key={s.title} className="how-card">
              <div className="how-card__icon" style={{ background: s.color }}>
                {s.icon}
              </div>
              <span
                className="how-card__badge"
                style={{ background: s.badge_color, color: s.badge_text }}
              >
                {s.badge}
              </span>
              <h3 className="how-card__title">{s.title}</h3>
              <p className="how-card__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Design Gallery ────────────────────────────────────────────────────
const gallery = [
  {
    src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092125.png",
    badge: "🔥 Hot",
    badgeCls: "badge--blue",
    title: "Mẫu Lớp A1",
    offset: false,
  },
  {
    src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092149.png",
    badge: "🚩 Sự kiện",
    badgeCls: "badge--red",
    title: "Sự Kiện Trắng Đỏ",
    offset: true,
  },
  {
    src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092131.png",
    badge: "❄️ Club",
    badgeCls: "badge--purple",
    title: "Áo Club Năng Động",
    offset: false,
  },
  {
    src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092137.png",
    badge: "⭐ Mới",
    badgeCls: "badge--green",
    title: "Áo Trường Cá Tính",
    offset: true,
  },
];

function Gallery() {
  return (
    <section className="section section--gray">
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#4f46e5" }}>
            Mẫu Thiết Kế Nổi Bật
          </span>
          <h2 className="section__title">Khơi nguồn cảm hứng sáng tạo</h2>
          <div className="section__divider" />
        </div>
        <div className="gallery-grid">
          {gallery.map((g) => (
            <Link
              key={g.title}
              to="/product-detail"
              className={`gallery-card ${g.offset ? "gallery-card--offset" : ""}`}
            >
              <img src={g.src} alt={g.title} className="gallery-card__img" />
              <div className="gallery-card__overlay" />
              <div className="gallery-card__info">
                <span className={`gallery-badge ${g.badgeCls}`}>{g.badge}</span>
                <h3 className="gallery-card__title">{g.title}</h3>
              </div>
            </Link>
          ))}
        </div>
        <div className="section__cta">
          <Link to="/category" className="btn-outline-primary">
            Xem tất cả mẫu thiết kế →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Marquee Partners ──────────────────────────────────────────────────
const logos = [
  { src: "/images/Logo_Cac_Truong/logo_Fpt.webp", alt: "FPT" },
  { src: "/images/Logo_Cac_Truong/logo_VNU.png", alt: "VNU" },
  { src: "/images/Logo_Cac_Truong/logo_HVTC.webp", alt: "HVTC" },
  { src: "/images/Logo_Cac_Truong/logo_bk.webp", alt: "HUST" },
  { src: "/images/Logo_Cac_Truong/logo_NEU.webp", alt: "NEU" },
  { src: "/images/Logo_Cac_Truong/logo_CN.webp", alt: "HaUI" },
  { src: "/images/Logo_Cac_Truong/logo_NH.webp", alt: "BA" },
  { src: "/images/Logo_Cac_Truong/logo_SuPham.webp", alt: "HNUE" },
  { src: "/images/Logo_Cac_Truong/logo_TL.webp", alt: "TLU" },
  { src: "/images/Logo_Cac_Truong/logo_ThangLong.webp", alt: "ThangLong" },
];

const marqueeLogos = [
  ...logos.map((logo) => ({ ...logo, marqueeId: `${logo.alt}-primary` })),
  ...logos.map((logo) => ({ ...logo, marqueeId: `${logo.alt}-secondary` })),
];

function Partners() {
  return (
    <section className="section section--white">
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#64748b" }}>
            Đối Tác Đồng Hành
          </span>
          <h2 className="section__title">
            Được tin dùng bởi các trường hàng đầu
          </h2>
        </div>
        <div className="marquee-wrapper">
          <div className="marquee-fade marquee-fade--left" />
          <div className="marquee-fade marquee-fade--right" />
          <div className="marquee-track">
            {marqueeLogos.map((l) => (
              <div key={l.marqueeId} className="marquee-logo">
                <img src={l.src} alt={l.alt} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────
const reviews = [
  {
    stars: 5,
    text: '"Thiết kế áo cực dễ, cả lớp mình chỉ mất 30 phút là xong. Chất lượng in rất đẹp, màu sắc y hệt bản preview!"',
    name: "Trần Hùng",
    role: "Lớp trưởng K18 — ĐH FPT",
    initials: "TH",
    color: "linear-gradient(135deg,#3b82f6,#6366f1)",
  },
  {
    stars: 5,
    text: '"Mình rất thích tính năng AI, chỉ cần mô tả ý tưởng là có ngay họa tiết. Giao hàng nhanh, đóng gói cẩn thận."',
    name: "Linh Nguyễn",
    role: "CLB Tình nguyện — ĐH Bách khoa",
    initials: "LN",
    color: "linear-gradient(135deg,#ec4899,#9333ea)",
  },
  {
    stars: 4.5,
    text: '"Đặt 50 áo cho lớp, giá cực hợp lý. Công cụ customizer rất chuyên nghiệp, thao tác dễ hiểu ngay từ lần đầu."',
    name: "Minh Phát",
    role: "BCS Lớp — HV Tài chính",
    initials: "MP",
    color: "linear-gradient(135deg,#22c55e,#059669)",
  },
];

function Testimonials() {
  return (
    <section className="section section--gray">
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#2563eb" }}>
            Khách Hàng Nói Gì
          </span>
          <h2 className="section__title">Đánh giá từ người dùng</h2>
          <div className="section__divider" />
        </div>
        <div className="review-grid">
          {reviews.map((r) => (
            <div key={r.name} className="review-card">
              <div className="review-stars">
                {"⭐".repeat(Math.floor(r.stars))}
                {r.stars % 1 ? "½" : ""}
              </div>
              <p className="review-text">{r.text}</p>
              <div className="review-author">
                <div className="review-avatar" style={{ background: r.color }}>
                  {r.initials}
                </div>
                <div>
                  <p className="review-name">{r.name}</p>
                  <p className="review-role">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────
function CtaBanner() {
  return (
    <section className="cta-section">
      <div className="cta-section__blob cta-section__blob--top" />
      <div className="cta-section__blob cta-section__blob--bottom" />
      <div className="cta-section__content">
        <h2 className="cta-section__title">
          Bạn đã sẵn sàng
          <br />
          thiết kế áo trường lớp?
        </h2>
        <p className="cta-section__sub">
          Bắt đầu miễn phí ngay hôm nay. Chỉ cần vài phút để tạo ra chiếc áo lớp
          mang đậm chất riêng của bạn.
        </p>
        <div className="cta-section__btns">
          <Link to="/customizer" className="btn-cta-primary">
            ✨ Tạo Thiết Kế Ngay →
          </Link>
          <Link to="/contact" className="btn-cta-secondary">
            📞 Liên hệ tư vấn
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="alma-footer">
      <div className="alma-footer__inner">
        <div className="alma-footer__brand">
          <Link to="/" className="alma-footer__logo-link">
            <img
              src="/images/logo.png"
              alt="ALMA"
              className="alma-footer__logo-img"
            />
            <span className="alma-footer__logo-text">
              ALMA<span>.</span>
            </span>
          </Link>
          <p className="alma-footer__tagline">
            Nền tảng thiết kế đồng phục hàng đầu dành cho học sinh, sinh viên.
            Chạm tay vào phong cách, sáng tạo chất riêng của bạn.
          </p>
        </div>
        <div className="alma-footer__contact">
          <h3 className="alma-footer__heading">Liên Hệ</h3>
          <p>📍 Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</p>
          <p>
            📞 <a href="tel:0123456789">0123 456 789</a>
          </p>
          <p>
            ✉️ <a href="mailto:contact@almacustom.vn">contact@almacustom.vn</a>
          </p>
        </div>
        <div className="alma-footer__social">
          <h3 className="alma-footer__heading">Kết Nối</h3>
          <div className="alma-footer__socials">
            <a
              href="https://facebook.com"
              className="alma-footer__social-btn"
              aria-label="Facebook"
            >
              f
            </a>
            <a
              href="https://instagram.com"
              className="alma-footer__social-btn"
              aria-label="Instagram"
            >
              📷
            </a>
            <a
              href="https://www.tiktok.com"
              className="alma-footer__social-btn"
              aria-label="TikTok"
            >
              ♪
            </a>
          </div>
        </div>
      </div>
      <div className="alma-footer__bottom">
        <p>© 2026 ALMA Custom Threads. All rights reserved.</p>
        <div className="alma-footer__links">
          <a href="/privacy">Chính sách bảo mật</a>
          <a href="/terms">Điều khoản dịch vụ</a>
        </div>
      </div>
    </footer>
  );
}

// ── Main export ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div
      style={{
        fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif", // <--- Đổi thành Trebuchet MS
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>
        <Hero />
        <HowItWorks />
        <Gallery />
        <Partners />
        <Testimonials />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}