import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import authApi from "../../auth/api/authApi";
import { toast } from "react-hot-toast";
import { cartApi } from "../../cart/api/cartApi";
import Navbar from "../../../shared/components/Navbar";
import Footer from "../../../shared/components/Footer";
import "./StoryPage.css";

// ── Data ──────────────────────────────────────────────────────────────
const MEMBERS = [
  { id: 1, name: "Nguyễn Thị Hải Yến",  role: "CEO & Co-founder", avatar: "/images/members/haiyen.png",    desc: "Người đặt nền móng cho ALMA, với đam mê thiết kế và tầm nhìn xa về thời trang học đường." },
  { id: 2, name: "Bùi Thị Thùy Dương", role: "CTO & Co-founder", avatar: "/images/members/thuyduong.png", desc: "Kiến trúc sư công nghệ, xây dựng nền tảng thiết kế trực tuyến từ những dòng code đầu tiên." },
  { id: 3, name: "Tăng Lan Anh",        role: "CMO & Co-founder", avatar: "/images/members/lananh.png",    desc: "Người kết nối ALMA với hàng nghìn trường học và cộng đồng sinh viên trên cả nước." },
  { id: 4, name: "Nguyễn Phúc Lâm",    role: "COO & Co-founder", avatar: "/images/members/phuclam.png",   desc: "Đảm bảo mỗi chiếc áo đến tay khách hàng đúng hẹn, đúng chất lượng đã cam kết." },
  { id: 5, name: "Phạm Thế Sơn",       role: "CPO & Co-founder", avatar: "/images/members/theson.jpg",    desc: "Xây dựng mô hình tài chính bền vững, giúp ALMA tăng trưởng đúng hướng và hiệu quả." },
  { id: 6, name: "Nguyễn Bá Sơn",      role: "CFO & Co-founder", avatar: "/images/members/bason.png",     desc: "Sáng tạo không ngừng để mỗi tính năng trên ALMA đều đơn giản, thú vị và hữu ích." },
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


// ── Member Card ───────────────────────────────────────────────────────
function MemberCard({ member, index }: { member: typeof MEMBERS[0]; index: number }) {
  return (
    <div className="member-card" style={{ animationDelay: `${index * 0.12}s` }}>
      {/* Rainbow spinning border */}
      <div className="rainbow-ring-wrapper">
        <div className="rainbow-ring-bg" />
        <div className="rainbow-ring-inner">
          <div className="member-photo-link" aria-label={member.name}>
            <img
              src={member.avatar}
              alt={member.name}
              className="member-photo"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
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
