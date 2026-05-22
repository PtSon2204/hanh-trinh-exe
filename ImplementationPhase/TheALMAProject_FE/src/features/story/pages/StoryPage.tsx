import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import authApi from "../../auth/api/authApi";
import { toast } from "react-hot-toast";
import { cartApi } from "../../cart/api/cartApi";
import "./StoryPage.css";

// ── Data ──────────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 1, name: "Phạm Thế Sơn",    role: "CEO & Co-founder",  emoji: "🚀", desc: "Người đặt nền móng cho ALMA, với đam mê thiết kế và tầm nhìn xa về thời trang học đường." },
  { id: 2, name: "Nguyễn Văn Minh", role: "CTO & Co-founder",  emoji: "💻", desc: "Kiến trúc sư công nghệ, xây dựng nền tảng thiết kế trực tuyến từ những dòng code đầu tiên." },
  { id: 3, name: "Trần Thị Lan",    role: "CMO & Co-founder",  emoji: "🎨", desc: "Người kết nối ALMA với hàng nghìn trường học và cộng đồng sinh viên trên cả nước." },
  { id: 4, name: "Lê Quốc Hùng",   role: "COO & Co-founder",  emoji: "⚙️", desc: "Đảm bảo mỗi chiếc áo đến tay khách hàng đúng hẹn, đúng chất lượng đã cam kết." },
  { id: 5, name: "Hoàng Thị Mai",  role: "CFO & Co-founder",  emoji: "📊", desc: "Xây dựng mô hình tài chính bền vững, giúp ALMA tăng trưởng đúng hướng và hiệu quả." },
  { id: 6, name: "Vũ Thanh Tùng",  role: "CPO & Co-founder",  emoji: "✨", desc: "Sáng tạo không ngừng để mỗi tính năng trên ALMA đều đơn giản, thú vị và hữu ích." },
];

const STORY_SECTIONS = [
  {
    id: 1, year: "2023",
    title: "Bắt đầu từ một câu hỏi",
    text: "Tất cả bắt đầu từ một câu hỏi đơn giản: \"Tại sao đặt áo lớp lại phức tạp đến vậy?\" Sáu người bạn ngồi lại trong căn phòng ký túc xá nhỏ, chia sẻ nỗi khó chịu chung về quy trình đặt áo thủ công, rườm rà — và quyết định tự tay giải quyết.",
    side: "right", img: "#", emoji: "💡",
  },
  {
    id: 2, year: "2024",
    title: "Những ngày đầu xây dựng",
    text: "Từ ý tưởng trên giấy đến dòng code đầu tiên, ALMA ra đời với công cụ thiết kế kéo-thả đơn giản nhất. Chúng tôi làm việc suốt đêm, chạy thử nghiệm trên 5 lớp học đầu tiên và nhận được phản hồi đầy cảm xúc từ các bạn sinh viên.",
    side: "left",  img: "#", emoji: "🔨",
  },
  {
    id: 3, year: "2025",
    title: "ALMA — Hôm nay & Tương lai",
    text: "Từ 5 lớp học ban đầu, ALMA đã phục vụ hơn 500 trường học, in hơn 10.000 chiếc áo chất lượng cao. Chúng tôi không dừng lại ở đây — AI thiết kế, giao hàng nhanh, và mở rộng ra khắp Việt Nam là những mục tiêu tiếp theo.",
    side: "right", img: "#", emoji: "🌟",
  },
];

// SVG member positions (viewBox 0 0 100 100)
const MEMBER_POS = [
  { cx: 16.7, cy: 27 },
  { cx: 50,   cy: 27 },
  { cx: 83.3, cy: 27 },
  { cx: 16.7, cy: 73 },
  { cx: 50,   cy: 73 },
  { cx: 83.3, cy: 73 },
];

// Connection pairs
const CONNECTIONS = [
  [0, 1], [1, 2],       // top row
  [3, 4], [4, 5],       // bottom row
  [0, 3], [1, 4], [2, 5], // verticals
  [0, 4], [1, 3],       // cross left
  [1, 5], [2, 4],       // cross right
];

// ── Floating background icons ────────────────────────────────────────
const FLOATING_ICONS = [
  { emoji: "🎓", size: 2.8, x: 4,   y: 8,  dur: 9,  delay: 0,   rotate: -15 },
  { emoji: "📚", size: 2.2, x: 88,  y: 12, dur: 11, delay: 1.2, rotate: 10  },
  { emoji: "✏️", size: 2.0, x: 14,  y: 42, dur: 8,  delay: 2.5, rotate: 25  },
  { emoji: "🎨", size: 2.5, x: 76,  y: 38, dur: 10, delay: 0.8, rotate: -20 },
  { emoji: "💻", size: 2.6, x: 45,  y: 6,  dur: 12, delay: 3.5, rotate: 8   },
  { emoji: "📐", size: 1.8, x: 92,  y: 60, dur: 7,  delay: 1.8, rotate: -30 },
  { emoji: "🖊️", size: 1.9, x: 6,   y: 72, dur: 9,  delay: 4.2, rotate: 18  },
  { emoji: "📝", size: 2.1, x: 58,  y: 90, dur: 10, delay: 0.5, rotate: -12 },
  { emoji: "🔬", size: 2.0, x: 30,  y: 88, dur: 8,  delay: 2.0, rotate: 22  },
  { emoji: "📏", size: 1.7, x: 70,  y: 78, dur: 11, delay: 3.0, rotate: -8  },
  { emoji: "🖥️", size: 2.4, x: 22,  y: 20, dur: 13, delay: 5.0, rotate: 5   },
  { emoji: "📓", size: 2.0, x: 82,  y: 82, dur: 9,  delay: 1.5, rotate: -18 },
  { emoji: "🎒", size: 2.3, x: 50,  y: 50, dur: 10, delay: 3.8, rotate: 12  },
  { emoji: "🏫", size: 2.8, x: 38,  y: 72, dur: 14, delay: 0.3, rotate: -5  },
  { emoji: "⭐", size: 1.6, x: 65,  y: 18, dur: 7,  delay: 4.8, rotate: 30  },
  { emoji: "🖌️", size: 2.0, x: 10,  y: 58, dur: 8,  delay: 2.2, rotate: -25 },
  { emoji: "📡", size: 1.8, x: 96,  y: 30, dur: 11, delay: 1.0, rotate: 15  },
  { emoji: "🧮", size: 2.1, x: 2,   y: 30, dur: 10, delay: 6.0, rotate: -10 },
];

// ── Navbar (same as ContactPage) ──────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    cartApi.getMyCart()
      .then(cart => {
        const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      })
      .catch(() => {});
  }, [user]);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { }
    logout(); toast.success("Đã đăng xuất!");
  };
  return (
    <>
      <header className="alma-nav">
        <div className="alma-nav__inner">
          <button className="alma-nav__mobile-btn" onClick={() => setMobileOpen(o => !o)} type="button">
            <span className="hamburger-icon">{mobileOpen ? "✕" : "☰"}</span>
          </button>
          <Link to="/" className="alma-nav__brand">
            <img src="/images/logo.png" alt="ALMA Logo" className="alma-nav__logo" />
            <span className="alma-nav__title">ALMA Custom Threads<span className="dot">.</span></span>
          </Link>
          <nav className="alma-nav__links">
            <Link to="/" className="alma-nav__link">Trang Chủ</Link>
            <Link to="/category" className="alma-nav__link">Sản Phẩm</Link>
            <Link to="/Story" className="alma-nav__link alma-nav__link--active">Câu chuyện</Link>
            <Link to="/orders" className="alma-nav__link alma-nav__link--hide-md">Đơn hàng</Link>
            <Link to="/contact" className="alma-nav__link alma-nav__link--hide-md">Liên hệ</Link>
            <Link to="/customizer" className="alma-nav__link alma-nav__link--design">✨ Thiết Kế Ngay</Link>
          </nav>
          <div className="alma-nav__actions">
            <Link to="/category" className="alma-nav__icon-btn" aria-label="Search">🔍</Link>
            <Link to="/cart" className="alma-nav__icon-btn alma-nav__cart" aria-label="Cart">
              🛒{cartCount > 0 && <span className="alma-nav__badge">{cartCount}</span>}
            </Link>
            {user ? (
              <div className="alma-nav__user-menu">
                <Link to="/profile" className="alma-nav__login-btn">
                  👤 {user.fullName.split(" ").pop()}
                </Link>
                <div className="alma-nav__dropdown">
                  <Link to="/profile" className="alma-nav__dropdown-item">
                    👤 Trang cá nhân
                  </Link>
                  {user.role === "Admin" || user.role === "Product Manager" ? (
                    <Link to="/admin" className="alma-nav__dropdown-item">
                      🛠️ Trang quản trị
                    </Link>
                  ) : (
                    <>
                      <Link to="/my-designs" className="alma-nav__dropdown-item">
                        🎨 Lịch sử thiết kế
                      </Link>
                      <Link to="/orders" className="alma-nav__dropdown-item">
                        📦 Đơn hàng
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="alma-nav__dropdown-item alma-nav__dropdown-item--logout"
                    type="button"
                  >
                    🚪 Đăng xuất
                  </button>
                </div>
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
            <Link to="/" onClick={() => setMobileOpen(false)}>Trang Chủ</Link>
            <Link to="/category" onClick={() => setMobileOpen(false)}>Sản Phẩm</Link>
            <Link to="/Story" onClick={() => setMobileOpen(false)}>Câu chuyện</Link>
            <Link to="/customizer" onClick={() => setMobileOpen(false)}>✨ Thiết Kế Ngay</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)}>👤 Trang cá nhân</Link>
                {user.role === "Admin" || user.role === "Product Manager" ? (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>🛠️ Trang quản trị</Link>
                ) : (
                  <>
                    <Link to="/my-designs" onClick={() => setMobileOpen(false)}>🎨 Lịch sử thiết kế</Link>
                    <Link to="/orders" onClick={() => setMobileOpen(false)}>📦 Đơn hàng</Link>
                  </>
                )}
                <button
                  onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="alma-nav__logout-btn-mobile"
                  type="button"
                >
                  🚪 Đăng xuất
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMobileOpen(false)}>👤 Đăng nhập</Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="alma-footer">
      <div className="alma-footer__inner">
        <div className="alma-footer__brand">
          <Link to="/" className="alma-footer__logo-link">
            <img src="/images/logo.png" alt="ALMA" className="alma-footer__logo-img" />
            <span className="alma-footer__logo-text">ALMA<span>.</span></span>
          </Link>
          <p className="alma-footer__tagline">Nền tảng thiết kế đồng phục hàng đầu dành cho học sinh, sinh viên.</p>
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
          <a href="/privacy">Chính sách bảo mật</a>
          <a href="/terms">Điều khoản dịch vụ</a>
        </div>
      </div>
    </footer>
  );
}

// ── Member Card ───────────────────────────────────────────────────────
function MemberCard({ member, index }: { member: typeof MEMBERS[0]; index: number }) {
  return (
    <div className="member-card" style={{ animationDelay: `${index * 0.12}s` }}>
      {/* Rainbow spinning border */}
      <div className="rainbow-ring-wrapper">
        <div className="rainbow-ring-bg" />
        <div className="rainbow-ring-inner">
          <a href="#" className="member-photo-link" aria-label={member.name}>
            <img
              src="#"
              alt={member.name}
              className="member-photo"
            />
            <div className="member-photo-fallback">{member.emoji}</div>
          </a>
        </div>
      </div>

      <div className="member-info">
        <h3 className="member-name">{member.name}</h3>
        <p className="member-role">{member.role}</p>
        <p className="member-desc">{member.desc}</p>
      </div>
    </div>
  );
}

// ── Floating Icons Layer ─────────────────────────────────────────────
function FloatingIcons() {
  return (
    <div className="floating-icons" aria-hidden="true">
      {FLOATING_ICONS.map((icon, i) => (
        <span
          key={i}
          className="floating-icon"
          style={{
            left: `${icon.x}%`,
            top: `${icon.y}%`,
            fontSize: `${icon.size}rem`,
            animationDuration: `${icon.dur}s`,
            animationDelay: `${icon.delay}s`,
            '--rotate': `${icon.rotate}deg`,
          } as React.CSSProperties}
        >
          {icon.emoji}
        </span>
      ))}
    </div>
  );
}

// ── Team Section ──────────────────────────────────────────────────────
function TeamSection() {
  return (
    <section className="story-team">
      <div className="story-team__container">
        <div className="story-section__eyebrow">🌟 Đồng Sáng Lập</div>
        <h2 className="story-section__title">6 người bạn, 1 giấc mơ chung</h2>
        <p className="story-section__sub">
          Chúng tôi là những sinh viên từng khó khăn khi đặt áo lớp — và quyết định tự xây giải pháp.
        </p>

        {/* Grid + SVG connections wrapper */}
        <div className="team-grid-wrapper">
          <svg
            className="team-svg-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <filter id="glow-filter">
                <feGaussianBlur stdDeviation="0.3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {CONNECTIONS.map(([a, b], i) => {
              const pa = MEMBER_POS[a];
              const pb = MEMBER_POS[b];
              return (
                <line
                  key={`${a}-${b}`}
                  x1={pa.cx} y1={pa.cy}
                  x2={pb.cx} y2={pb.cy}
                  className="connection-line"
                  strokeWidth="0.6"
                  vectorEffect="non-scaling-stroke"
                  filter="url(#glow-filter)"
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              );
            })}
          </svg>
          <div className="team-grid">
            {MEMBERS.map((m, i) => (
              <MemberCard key={m.id} member={m} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Story Sections (alternating) ──────────────────────────────────────
function StorySections() {
  return (
    <section className="story-journey">
      <div className="story-journey__container">
        <div className="story-section__eyebrow" style={{ color: "#6366f1" }}>📖 Câu Chuyện</div>
        <h2 className="story-section__title">Hành trình của chúng tôi</h2>

        {STORY_SECTIONS.map((s, i) => (
          <div key={s.id} className={`journey-block ${s.side === "left" ? "journey-block--reverse" : ""}`}>
            {/* Text */}
            <div className="journey-text">
              <span className="journey-year">{s.year}</span>
              <h3 className="journey-title">
                <span className="journey-emoji">{s.emoji}</span> {s.title}
              </h3>
              <p className="journey-desc">{s.text}</p>
            </div>

            {/* Image */}
            <div className="journey-img-wrapper">
              <a href="#" className="journey-img-link">
                <div className="journey-img-fallback">
                  <span>{s.emoji}</span>
                  <p>Ảnh {s.year}</p>
                </div>
              </a>
            </div>

            {/* Connector line between blocks */}
            {i < STORY_SECTIONS.length - 1 && (
              <div className="journey-connector" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Quote Section ─────────────────────────────────────────────────────
function QuoteSection() {
  return (
    <section className="story-quote">
      <div className="story-quote__blob story-quote__blob--1" />
      <div className="story-quote__blob story-quote__blob--2" />
      <div className="story-quote__content">
        <div className="story-quote__mark">"</div>
        <p className="story-quote__text">
          ALMA không chỉ là nơi đặt áo — đây là nơi mỗi lớp học, mỗi thế hệ sinh viên
          được ghi dấu theo cách riêng của họ.
        </p>
        <p className="story-quote__author">— Nhóm sáng lập ALMA Custom Threads</p>
      </div>
    </section>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────
function StoryHero() {
  return (
    <section className="story-hero">
      <div className="story-hero__blob story-hero__blob--1" />
      <div className="story-hero__blob story-hero__blob--2" />
      <div className="story-hero__content">
        <span className="story-hero__eyebrow">✍️ Câu Chuyện Của Chúng Tôi</span>
        <h1 className="story-hero__title">
          Từ ký túc xá<br />đến nền tảng đồng phục #1
        </h1>
        <p className="story-hero__sub">
          Chúng tôi là những sinh viên từng trải qua nỗi khổ đặt áo lớp —<br />
          và quyết định thay đổi điều đó mãi mãi.
        </p>
      </div>
    </section>
  );
}

// ── Page Export ───────────────────────────────────────────────────────
export default function StoryPage() {
  return (
    <div style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <StoryHero />

        {/* Wrapper bao gồm cả 2 section với floating icons chung */}
        <div className="story-middle-wrapper">
          {/* Floating icons trôi nổi ở background */}
          <FloatingIcons />

          {/* Gradient blobs trang trí */}
          <div className="story-mid-blob story-mid-blob--1" />
          <div className="story-mid-blob story-mid-blob--2" />
          <div className="story-mid-blob story-mid-blob--3" />

          {/* Nội dung 2 section */}
          <div className="story-middle-inner">
            <TeamSection />
            <div className="story-mid-divider" aria-hidden="true">
              <div className="story-mid-divider__line" />
              <span className="story-mid-divider__star">✦</span>
              <div className="story-mid-divider__line" />
            </div>
            <StorySections />
          </div>
        </div>

        <QuoteSection />
      </main>
      <Footer />
    </div>
  );
}
