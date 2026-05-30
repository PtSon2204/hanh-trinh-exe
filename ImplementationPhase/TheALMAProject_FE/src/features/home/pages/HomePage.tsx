import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../shared/components/Navbar";
import Footer from "../../../shared/components/Footer";
import "./HomePage.css";

// ── Char spans (Hero heading effect) ────────────────────────────────
function buildCharSpans(text: string, container: HTMLSpanElement) {
  if (!container) return;
  container.innerHTML = "";
  const words = text.split(" ");
  
  // A beautiful selection of Coolors-style vibrant colors
  const colors = [
    "#FF1E27", // Vibrant Red
    "#FF8A00", // Vivid Orange
    "#FFD600", // Vivid Yellow
    "#00E676", // Bright Green
    "#00B0FF", // Bright Blue
    "#7C4DFF", // Bright Purple
    "#FF4081", // Bright Pink
    "#00E5FF", // Neon Cyan
  ];

  words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement("span");
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";

    word.split("").forEach((char) => {
      const span = document.createElement("span");
      span.className = "hero-char";
      span.textContent = char;

      let timer: ReturnType<typeof setTimeout> | null = null;

      span.addEventListener("mouseenter", () => {
        if (timer) clearTimeout(timer);

        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        span.style.color = randomColor;
        span.style.textShadow = `0 0 12px ${randomColor}bb, 0 0 24px ${randomColor}66`;
        span.classList.add("shake-active");

        timer = setTimeout(() => {
          span.style.color = "";
          span.style.textShadow = "";
          span.classList.remove("shake-active");
        }, 3000);
      });

      wordSpan.appendChild(span);
    });

    container.appendChild(wordSpan);

    // Add space after word
    if (wordIndex < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = "hero-space";
      spaceSpan.innerHTML = "&nbsp;";
      container.appendChild(spaceSpan);
    }
  });
}

// ── Fun Canvas: bubbles + color streaks (global fixed layer) ──────────
const SCHOOL_EMOJIS = ["🎒", "🎓", "📚", "✏️", "📐", "🖊️", "📏", "🏫", "🎨", "🔬", "📝", "⚽", "🏆", "🎭", "🎵"];
const RAINBOW_COLORS = ["#ff4444","#ff8c00","#ffe000","#44dd44","#00bbff","#8844ff","#ff44cc","#ff6699","#00ffcc","#ff7700"];

function FunCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // ── 1. Spawn bubbles ──────────────────────────────────────────
    const bubbles: HTMLDivElement[] = [];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement("div");
      b.className = "bubble";
      const size = 18 + Math.random() * 42;
      const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
      const dur = 5 + Math.random() * 7;
      const delay = Math.random() * 10;
      const left = Math.random() * 100;
      b.style.cssText = `
        width:${size}px; height:${size}px;
        left:${left}%;
        background: radial-gradient(circle at 35% 35%, ${color}cc, ${color}44);
        border: 2px solid ${color}99;
        backdrop-filter: blur(2px);
        --dur:${dur}s; --delay:${delay}s;
        box-shadow: inset 0 0 ${size*0.4}px rgba(255,255,255,.4);
      `;
      b.style.pointerEvents = "none";
      container.appendChild(b);
      bubbles.push(b);
    }

    // ── 2. Spawn color streaks randomly ───────────────────────────
    const spawnStreak = () => {
      const s = document.createElement("div");
      s.className = "color-streak";
      const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
      const w = 60 + Math.random() * 180;
      const h = 3 + Math.random() * 7;
      const angle = (Math.random() - 0.5) * 60;
      const dur = 0.9 + Math.random() * 1.4;
      const left = Math.random() * W;
      const top = Math.random() * H;
      s.style.cssText = `
        width:${w}px; height:${h}px;
        left:${left}px; top:${top}px;
        background: linear-gradient(90deg, transparent, ${color}, ${color}bb, transparent);
        --angle:${angle}deg; --dur:${dur}s; --delay:0s;
        border-radius: 999px;
      `;
      container.appendChild(s);
      setTimeout(() => s.remove(), dur * 1000 + 100);
    };
    let streakTimer: ReturnType<typeof setInterval>;
    const scheduleStreak = () => {
      streakTimer = setInterval(() => {
        const count = 1;
        for (let i = 0; i < count; i++) setTimeout(spawnStreak, i * 120);
      }, 2500 + Math.random() * 1500);
    };
    scheduleStreak();

    // ── 3. Click anywhere → bubble pop effect ─────────────────────
    const handleClick = (e: MouseEvent) => {
      const color = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
      const size = 20 + Math.random() * 30;
      const pop = document.createElement("div");
      pop.className = "bubble-pop";
      pop.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - size/2}px; top:${e.clientY - size/2}px;
        position:fixed;
        background: radial-gradient(circle, ${color}cc, transparent);
        border: 2px solid ${color};
        z-index: 9999;
      `;
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 550);
      for (let i = 0; i < 4; i++) {
        const mini = document.createElement("div");
        mini.className = "bubble-pop";
        const ms = 6 + Math.random() * 12;
        const mx = e.clientX + (Math.random() - 0.5) * 60;
        const my = e.clientY + (Math.random() - 0.5) * 60;
        const mc = RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
        mini.style.cssText = `
          width:${ms}px; height:${ms}px;
          left:${mx - ms/2}px; top:${my - ms/2}px;
          position:fixed;
          background: radial-gradient(circle, ${mc}ee, transparent);
          border:1px solid ${mc};
          z-index:9999;
          animation-delay:${i*0.06}s;
        `;
        document.body.appendChild(mini);
        setTimeout(() => mini.remove(), 600);
      }
    };
    document.addEventListener("click", handleClick);

    return () => {
      clearInterval(streakTimer);
      document.removeEventListener("click", handleClick);
      bubbles.forEach(b => b.remove());
    };
  }, []);

  return <div ref={canvasRef} className="fun-canvas" aria-hidden="true" />;
}

// ── Hero Canvas: floating objs + shooting stars + graduation geese ────
// Absolute-positioned inside <section.hero> so it's clipped by overflow:hidden
function HeroCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const rect = () => container.getBoundingClientRect();
    const W = () => rect().width  || window.innerWidth;
    const H = () => rect().height || window.innerHeight;

    // ── A. Floating school objects ────────────────────────────────
    for (let i = 0; i < 5; i++) {
      const obj = document.createElement("div");
      obj.className = "floating-obj";
      const emoji = SCHOOL_EMOJIS[Math.floor(Math.random() * SCHOOL_EMOJIS.length)];
      const size = 1.1 + Math.random() * 1.6;
      const dur = 7 + Math.random() * 9;
      const delay = Math.random() * 12;
      const left = 2 + Math.random() * 96;
      const top  = 5 + Math.random() * 85;
      const driftX  = (Math.random() - 0.5) * 120;
      const driftY  = -40 - Math.random() * 80;
      const driftX2 = (Math.random() - 0.5) * 80;
      const driftY2 = driftY - 40 - Math.random() * 60;
      const rot  = (Math.random() - 0.5) * 40;
      const rot2 = (Math.random() - 0.5) * 30;
      obj.textContent = emoji;
      obj.style.cssText = `
        left:${left}%; top:${top}%;
        --size:${size}rem; --dur:${dur}s; --delay:${delay}s;
        --driftX:${driftX}px; --driftY:${driftY}px;
        --driftX2:${driftX2}px; --driftY2:${driftY2}px;
        --rot:${rot}deg; --rot2:${rot2}deg;
        font-size:${size}rem;
      `;
      container.appendChild(obj);
    }

    // ── B. Shooting stars ─────────────────────────────────────────
    const spawnShootingStar = () => {
      const w = W(); const h = H();
      const star = document.createElement("div");
      star.className = "shooting-star";
      const startX = Math.random() * w * 0.75;
      const startY = Math.random() * h * 0.55;
      const angle  = 18 + Math.random() * 28;
      const length = 110 + Math.random() * 200;
      const dur    = 0.65 + Math.random() * 0.9;
      star.style.cssText = `
        left:${startX}px; top:${startY}px;
        width:${length}px;
        --ss-angle:${angle}deg;
        --ss-dur:${dur}s;
      `;
      container.appendChild(star);
      setTimeout(() => star.remove(), dur * 1000 + 200);
    };
    const shootingStarTimer = setInterval(() => {
      const count = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < count; i++)
        setTimeout(spawnShootingStar, i * 350 + Math.random() * 250);
    }, 1800 + Math.random() * 1800);
    // kick off one right away
    setTimeout(spawnShootingStar, 600);

    return () => {
      clearInterval(shootingStarTimer);
    };
  }, []);

  return <div ref={canvasRef} className="hero-canvas" aria-hidden="true" />;
}

// ── Hero ──────────────────────────────────────────────────────────────
function Hero() {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (line1Ref.current) buildCharSpans("Áo trường lớp ", line1Ref.current);
    if (line2Ref.current) buildCharSpans("thiết kế theo cách của bạn", line2Ref.current);
  }, []);


  return (
    <section className="hero">
      <HeroCanvas />
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
            Nền tảng Thiết kế áo trường #1 Hòa Lạc
          </span>

          <h1 className="hero__heading">
            <span ref={line1Ref} />
            <span ref={line2Ref} />
          </h1>

          <p className="hero__desc">
            Tự tay thiết kế áo lớp, áo trường với công cụ trực tuyến — kéo thả
            sticker, thêm chữ, chọn màu &amp; AI hỗ trợ. Từ ý tưởng đến sản phẩm chỉ
            trong vài phút.
          </p>

          <div className="hero__cta">
            <Link to="/customizer" className="btn-hero-primary">
              ✨ Thiết kế ngay →
            </Link>
            <Link to="/category" className="btn-hero-secondary">
              👕 Xem mẫu áo
            </Link>
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
                  "/images/mockhoavit.jpg",
                  "/images/mockhoaconcoc.jpg",
                  "/images/cocpassed.jpg",
                  "/images/mocFPTU.jpg",
                ].map((src, i) => (
                  <div key={src} className={`hero__thumb ${i === 0 ? "hero__thumb--active" : ""}`}>
                    <img src={src} alt={`Mẫu ${i + 1}`} />
                  </div>
                ))}
              </div>
              <div className="hero__mockup-canvas">
                <img src="/images/Áo_đã_thiet_ke/1.png" alt="Áo đang thiết kế" />

              </div>
            </div>
            <div className="hero__mockup-footer">
              <div className="hero__swatches">
                {["#fff","#3b82f6","#1f2937","#f9a8d4","#4ade80","#fde047"].map((c) => (
                  <span key={c} className="hero__swatch" style={{ background: c, border: c === "#fff" ? "2px solid #60a5fa" : "none" }} />
                ))}
              </div>

            </div>
          </div>

          <div className="hero__badge-float hero__badge-float--top">
            <div className="hero__badge-icon" style={{ background: "linear-gradient(135deg,#4ade80,#10b981)" }}>✓</div>
            <div>
              <p className="hero__badge-title">Miễn phí thiết kế</p>
              <p className="hero__badge-sub">Chỉ tính phí in ấn</p>
            </div>
          </div>
          <div className="hero__badge-float hero__badge-float--bottom">
            <div className="hero__badge-icon" style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)" }}>✨</div>
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

// ── Section Floating Objects (dùng chung cho các section trắng/xám) ─────
interface SectionFloatsProps {
  emojis?: string[];
  blobColors?: string[];
  count?: number;
}
function SectionFloats({ emojis, blobColors, count = 10 }: SectionFloatsProps) {
  const defaultEmojis = ["🎒","🎓","📚","✏️","📐","🖊️","📏","🏫","🔬","📝","🖍️","📌","📎","🗂️","🏅","🎭","🎵","⚽","🏆","🧪","🔭","🖥️","📡","📓"];
  const defaultBlobs = ["#a5b4fc","#f9a8d4","#6ee7b7","#fde68a","#93c5fd","#c4b5fd","#fb7185","#34d399","#60a5fa","#f472b6"];
  const emojiList = emojis ?? defaultEmojis;
  const blobList  = blobColors ?? defaultBlobs;

  return (
    <div className="section-floats" aria-hidden="true">
      {/* Color blobs */}
      {blobList.slice(0, 4).map((c, i) => (
        <div key={`blob-${i}`} className="section-blob" style={{
          width:  `${160 + i * 60}px`,
          height: `${160 + i * 60}px`,
          background: c,
          left:  `${[5, 70, 30, 55][i]}%`,
          top:   `${[10, 5, 60, 75][i]}%`,
          '--bdur':   `${8 + i * 3}s`,
          '--bdelay': `${i * 1.5}s`,
          '--bx':     `${(i % 2 === 0 ? 1 : -1) * (30 + i * 10)}px`,
          '--by':     `${(i % 2 === 0 ? -1 : 1) * (20 + i * 8)}px`,
        } as React.CSSProperties} />
      ))}

      {/* Floating emoji objects */}
      {Array.from({ length: count }).map((_, i) => {
        const emoji = emojiList[i % emojiList.length];
        const size  = 1 + Math.random() * 1.4;
        const dur   = 6 + (i * 1.3) % 8;
        const delay = (i * 0.9) % 10;
        const left  = 3 + (i * 9.3) % 94;
        const top   = 5 + (i * 11.7) % 88;
        const dx    = ((i % 2 === 0 ? 1 : -1) * (20 + (i * 7) % 60));
        const dy    = -15 - (i * 5) % 50;
        const dx2   = ((i % 2 === 0 ? -1 : 1) * (10 + (i * 5) % 40));
        const dy2   = dy - 10 - (i * 4) % 30;
        const r1    = ((i % 2 === 0 ? 1 : -1) * (10 + (i * 6) % 30));
        const r2    = ((i % 2 === 0 ? -1 : 1) * (5 + (i * 4) % 20));
        return (
          <span key={i} className="section-obj" style={{
            left: `${left}%`, top: `${top}%`,
            fontSize: `${size}rem`,
            '--dur':   `${dur}s`,
            '--delay': `${delay}s`,
            '--dx': `${dx}px`, '--dy': `${dy}px`,
            '--dx2': `${dx2}px`, '--dy2': `${dy2}px`,
            '--r1': `${r1}deg`, '--r2': `${r2}deg`,
          } as React.CSSProperties}>
            {emoji}
          </span>
        );
      })}
    </div>
  );
}

// ── How It Works ──────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      icon: "👕",
      color: "linear-gradient(135deg,#3b82f6,#2563eb)",
      badge: "Bước 1", badge_color: "#dbeafe", badge_text: "#2563eb",
      title: "Chọn Phôi Áo",
      desc: "Hơn 100 mẫu phôi từ áo thun, polo, sơ mi đến hoodie. Đa dạng kiểu dáng để bạn lựa chọn.",
    },
    {
      icon: "🎨",
      color: "linear-gradient(135deg,#6366f1,#9333ea)",
      badge: "Bước 2", badge_color: "#e0e7ff", badge_text: "#4f46e5",
      title: "Tự Thiết Kế Online",
      desc: "Kéo thả sticker, thêm chữ, chọn màu, logo trường. AI hỗ trợ tạo họa tiết độc đáo chỉ bằng mô tả.",
    },
    {
      icon: "🚚",
      color: "linear-gradient(135deg,#22c55e,#059669)",
      badge: "Bước 3", badge_color: "#dcfce7", badge_text: "#16a34a",
      title: "Đặt Hàng & Nhận Áo",
      desc: "Chọn size cho cả lớp, thanh toán online. Áo được in chất lượng cao và giao tận nơi.",
    },
  ];
  return (
    <section className="section section--white">
      {/* Floating school objects + color blobs */}
      <SectionFloats
        emojis={["👕","✂️","🖊️","📐","📏","🎨","🖌️","📎","🗂️","📌","📚","🎒","🏫","🔬","📝"]}
        blobColors={["#bfdbfe","#ddd6fe","#bbf7d0","#fde68a"]}
        count={12}
      />
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#2563eb" }}>Quy Trình Đơn Giản</span>
          <h2 className="section__title">3 bước để có áo trường độc nhất</h2>
          <div className="section__divider" />
        </div>
        <div className="how-grid">
          {steps.map((s) => (
            <div key={s.title} className="how-card">
              <div className="how-card__icon" style={{ background: s.color }}>{s.icon}</div>
              <span className="how-card__badge" style={{ background: s.badge_color, color: s.badge_text }}>{s.badge}</span>
              <h3 className="how-card__title">{s.title}</h3>
              <p className="how-card__desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Design Gallery — rainbow border + shifting text ───────────────────
const gallery = [
  { src: "/images/Áo_đã_thiet_ke/AoConVitMauDen.jpg", badge: "🔥 Hot", badgeCls: "badge--blue", title: "Mẫu Lớp A1", offset: false },
  { src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092149.png", badge: "🚩 Sự kiện", badgeCls: "badge--red", title: "Sự Kiện Trắng Đỏ", offset: true },
  { src: "/images/Áo_đã_thiet_ke/Screenshot 2026-03-10 092154.png", badge: "❄️ Club", badgeCls: "badge--purple", title: "Áo Club Năng Động", offset: false },
  { src: "/images/Áo_đã_thiet_ke/theAlmaPolo.jpg", badge: "⭐ Mới", badgeCls: "badge--green", title: "Áo Trường Cá Tính", offset: true },
];

function Gallery() {
  return (
    <section className="section section--gray">
      <SectionFloats
        emojis={["🎓","🏆","🥇","🎭","🎨","🖼️","✨","🌈","🎪","🎠","🖌️","🎡","🌟","💫","🔥"]}
        blobColors={["#f5d0fe","#a5f3fc","#fde68a","#d1fae5"]}
        count={10}
      />
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#4f46e5" }}>Mẫu Thiết Kế Nổi Bật</span>
          <h2 className="section__title">Khơi nguồn cảm hứng sáng tạo</h2>
          <div className="section__divider" />
        </div>
        <div className="gallery-grid">
          {gallery.map((g) => (
            <div key={g.title} className={`gallery-card-wrap${g.offset ? " gallery-card--offset" : ""}`}>
              <Link to="/product-detail" className="gallery-card">
                <img src={g.src} alt={g.title} className="gallery-card__img" />
                <div className="gallery-card__overlay" />
                <div className="gallery-card__info">
                  <span className={`gallery-badge ${g.badgeCls}`}>{g.badge}</span>
                  <h3 className="gallery-card__title">{g.title}</h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="section__cta">
          <Link to="/category" className="btn-outline-primary">Xem tất cả mẫu thiết kế →</Link>
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
  ...logos.map((l) => ({ ...l, marqueeId: `${l.alt}-primary` })),
  ...logos.map((l) => ({ ...l, marqueeId: `${l.alt}-secondary` })),
];

function Partners() {
  return (
    <section className="section section--white">
      <SectionFloats
        emojis={["🏫","🎓","📜","🏅","🥇","🤝","🌐","📡","🔭","🧪","⚗️","🧬","💡","📊","📈"]}
        blobColors={["#c7d2fe","#fbcfe8","#a7f3d0","#fef3c7"]}
        count={11}
      />
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#64748b" }}>Đối Tác Đồng Hành</span>
          <h2 className="section__title">Được tin dùng bởi các trường hàng đầu</h2>
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
    name: "Trần Hùng", role: "Lớp trưởng K18 — ĐH FPT",
    initials: "TH", color: "linear-gradient(135deg,#3b82f6,#6366f1)",
  },
  {
    stars: 5,
    text: '"Mình rất thích tính năng AI, chỉ cần mô tả ý tưởng là có ngay họa tiết. Giao hàng nhanh, đóng gói cẩn thận."',
    name: "Linh Nguyễn", role: "CLB Tình nguyện — ĐH Bách khoa",
    initials: "LN", color: "linear-gradient(135deg,#ec4899,#9333ea)",
  },
  {
    stars: 4.5,
    text: '"Đặt 50 áo cho lớp, giá cực hợp lý. Công cụ customizer rất chuyên nghiệp, thao tác dễ hiểu ngay từ lần đầu."',
    name: "Minh Phát", role: "BCS Lớp — HV Tài chính",
    initials: "MP", color: "linear-gradient(135deg,#22c55e,#059669)",
  },
];

function Testimonials() {
  return (
    <section className="section section--gray">
      <SectionFloats
        emojis={["⭐","💬","🗣️","👍","❤️","🙌","🤩","😊","💯","🎉","🥳","✅","🌟","💪","🏅"]}
        blobColors={["#ede9fe","#fce7f3","#dcfce7","#fff7ed"]}
        count={12}
      />
      <div className="section__container">
        <div className="section__header">
          <span className="section__eyebrow" style={{ color: "#2563eb" }}>Khách Hàng Nói Gì</span>
          <h2 className="section__title">Đánh giá từ người dùng</h2>
          <div className="section__divider" />
        </div>
        <div className="review-grid">
          {reviews.map((r) => (
            <div key={r.name} className="review-card">
              <div className="review-stars">{"⭐".repeat(Math.floor(r.stars))}{r.stars % 1 ? "½" : ""}</div>
              <p className="review-text">{r.text}</p>
              <div className="review-author">
                <div className="review-avatar" style={{ background: r.color }}>{r.initials}</div>
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

      {/* Floating objects over CTA dark bg */}
      <SectionFloats
        emojis={["✨","🎓","👕","🎨","🏆","🎉","🥳","🌟","💫","🔥","🎊","🎁","🪄","🎯","🎪","🎭","🌈","⭐","💎","🚀"]}
        blobColors={["#818cf8","#f472b6","#34d399","#fbbf24"]}
        count={16}
      />
      <div className="cta-section__content">
        <h2 className="cta-section__title">
          Bạn đã sẵn sàng<br />thiết kế áo trường lớp?
        </h2>
        <p className="cta-section__sub">
          Bắt đầu miễn phí ngay hôm nay. Chỉ cần vài phút để tạo ra chiếc áo lớp mang đậm chất riêng của bạn.
        </p>
        <div className="cta-section__btns">
          <Link to="/customizer" className="btn-cta-primary">✨ Tạo Thiết Kế Ngay →</Link>
          <Link to="/contact" className="btn-cta-secondary">📞 Liên hệ tư vấn</Link>
        </div>
      </div>
    </section>
  );
}


// ── Main export ───────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Lớp animation toàn trang */}
      <FunCanvas />

      <Navbar />
      <main style={{ flex: 1, position: "relative", zIndex: 1 }}>
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