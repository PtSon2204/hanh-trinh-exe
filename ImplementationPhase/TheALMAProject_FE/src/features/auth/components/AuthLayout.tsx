import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Shared constants (same as HomePage) ─────────────────────────────
const SCHOOL_EMOJIS = ['🎒','✏️','📚','🎨','🌟'];
const SOFT_COLORS = ['#3a9fbf','#4db8d6','#7dd3e8','#c9b896','#f5f0e0','#ddd0b0','#bde4f0','#a8d8ea'];

// ── Fun Canvas: bubbles + color streaks (fixed, global layer) ────────
function AuthFunCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // 1. Spawn bubbles
    const bubbles: HTMLDivElement[] = [];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('div');
      b.className = 'auth-bubble';
      const size = 14 + Math.random() * 36;
      const color = SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
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
        box-shadow: inset 0 0 ${size * 0.4}px rgba(255,255,255,.4);
      `;
      b.style.pointerEvents = 'none';
      container.appendChild(b);
      bubbles.push(b);
    }

    // 2. Color streaks
    const spawnStreak = () => {
      const s = document.createElement('div');
      s.className = 'auth-streak';
      const color = SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
      const w = 50 + Math.random() * 150;
      const h = 2 + Math.random() * 5;
      const angle = (Math.random() - 0.5) * 60;
      const dur = 0.9 + Math.random() * 1.4;
      const left = Math.random() * W;
      const top = Math.random() * H;
      s.style.cssText = `
        width:${w}px; height:${h}px;
        left:${left}px; top:${top}px;
        position:fixed;
        background: linear-gradient(90deg, transparent, ${color}, ${color}bb, transparent);
        --angle:${angle}deg; --dur:${dur}s; --delay:0s;
        border-radius: 999px;
      `;
      container.appendChild(s);
      setTimeout(() => s.remove(), dur * 1000 + 100);
    };
    let streakTimer: ReturnType<typeof setInterval>;
    streakTimer = setInterval(() => {
      spawnStreak();
    }, 2000 + Math.random() * 3000);

    // 3. Click pop effect
    const handleClick = (e: MouseEvent) => {
      const color = SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
      const size = 18 + Math.random() * 24;
      const pop = document.createElement('div');
      pop.className = 'auth-bubble-pop';
      pop.style.cssText = `
        width:${size}px; height:${size}px;
        left:${e.clientX - size / 2}px; top:${e.clientY - size / 2}px;
        background: radial-gradient(circle, ${color}cc, transparent);
        border: 2px solid ${color};
      `;
      document.body.appendChild(pop);
      setTimeout(() => pop.remove(), 550);
      for (let i = 0; i < 4; i++) {
        const mini = document.createElement('div');
        mini.className = 'auth-bubble-pop';
        const ms = 5 + Math.random() * 10;
        const mx = e.clientX + (Math.random() - 0.5) * 50;
        const my = e.clientY + (Math.random() - 0.5) * 50;
        const mc = SOFT_COLORS[Math.floor(Math.random() * SOFT_COLORS.length)];
        mini.style.cssText = `
          width:${ms}px; height:${ms}px;
          left:${mx - ms / 2}px; top:${my - ms / 2}px;
          background: radial-gradient(circle, ${mc}ee, transparent);
          border:1px solid ${mc};
          animation-delay:${i * 0.06}s;
        `;
        document.body.appendChild(mini);
        setTimeout(() => mini.remove(), 600);
      }
    };
    document.addEventListener('click', handleClick);

    return () => {
      clearInterval(streakTimer);
      document.removeEventListener('click', handleClick);
      bubbles.forEach(b => b.remove());
    };
  }, []);

  return <div ref={canvasRef} className="auth-fun-canvas" aria-hidden="true" />;
}

// ── Hero Canvas: shooting stars + goose flock (left panel) ──────────
function AuthHeroCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;
    const rect = () => container.getBoundingClientRect();
    const W = () => rect().width || 640;
    const H = () => rect().height || 800;

    // A. Floating school objects
    for (let i = 0; i < 5; i++) {
      const obj = document.createElement('div');
      obj.className = 'auth-floating-obj';
      const emoji = SCHOOL_EMOJIS[Math.floor(Math.random() * SCHOOL_EMOJIS.length)];
      const size = 1.0 + Math.random() * 1.4;
      const dur = 7 + Math.random() * 9;
      const delay = Math.random() * 12;
      const left = 2 + Math.random() * 96;
      const top = 5 + Math.random() * 85;
      const driftX = (Math.random() - 0.5) * 100;
      const driftY = -40 - Math.random() * 70;
      const driftX2 = (Math.random() - 0.5) * 70;
      const driftY2 = driftY - 30 - Math.random() * 50;
      const rot = (Math.random() - 0.5) * 40;
      const rot2 = (Math.random() - 0.5) * 30;
      obj.textContent = emoji;
      obj.style.cssText = `
        left:${left}%; top:${top}%;
        font-size:${size}rem;
        --dur:${dur}s; --delay:${delay}s;
        --driftX:${driftX}px; --driftY:${driftY}px;
        --driftX2:${driftX2}px; --driftY2:${driftY2}px;
        --rot:${rot}deg; --rot2:${rot2}deg;
      `;
      container.appendChild(obj);
    }

    // B. Shooting stars
    const spawnShootingStar = () => {
      const w = W(); const h = H();
      const star = document.createElement('div');
      star.className = 'auth-shooting-star';
      const startX = Math.random() * w * 0.75;
      const startY = Math.random() * h * 0.55;
      const angle = 18 + Math.random() * 28;
      const length = 90 + Math.random() * 170;
      const dur = 0.65 + Math.random() * 0.9;
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
    }, 3500 + Math.random() * 3000);
    setTimeout(spawnShootingStar, 800);

    // C. Graduation-cap goose flock every 6 s
    const spawnGooseFlock = () => {
      const w = W();
      const flockSize = 2 + Math.floor(Math.random() * 2);
      const fromRight = Math.random() < 0.5;
      const baseY = 10 + Math.random() * 65;
      const scale = 0.8 + Math.random() * 0.6;
      const dur = 6 + Math.random() * 4;

      for (let i = 0; i < flockSize; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'auth-goose-unit';

        const cap = document.createElement('span');
        cap.className = 'auth-goose-cap';
        cap.textContent = '🎓';

        const body = document.createElement('span');
        body.className = 'auth-goose-body';
        body.textContent = '🦆';

        wrapper.appendChild(cap);
        wrapper.appendChild(body);

        const staggerGap = 30 + Math.random() * 18;
        const staggerY = (Math.random() - 0.5) * 24;
        const startX = fromRight ? w + 80 + i * staggerGap : -(80 + i * staggerGap);
        const endX = fromRight ? -(w + 160) : (w + 160);
        const flipVal = fromRight ? -1 : 1;

        wrapper.style.cssText = `
          left:${startX}px;
          top:calc(${baseY}% + ${staggerY}px);
          font-size:${scale * 1.6}rem;
          --goose-end:${endX - startX}px;
          --goose-flip:${flipVal};
          --goose-dur:${dur + i * 0.18}s;
          --goose-delay:${i * 0.14}s;
          animation: authGooseMarch var(--goose-dur) linear var(--goose-delay) forwards;
        `;
        container.appendChild(wrapper);
        setTimeout(() => wrapper.remove(), (dur + flockSize * 0.18 + 1) * 1000);
      }
    };

    spawnGooseFlock();
    const gooseTimer = setInterval(spawnGooseFlock, 10000);

    return () => {
      clearInterval(shootingStarTimer);
      clearInterval(gooseTimer);
    };
  }, []);

  return <div ref={canvasRef} className="auth-hero-canvas" aria-hidden="true" />;
}

// ── Right panel floating blobs ────────────────────────────────────────
function AuthRightBlobs() {
  const blobData = [
    { color: '#bde4f0', size: 220, left: 80, top: 5, bx: 30, by: -20, bx2: -15, by2: 10, dur: 12, delay: 0 },
    { color: '#f5f0e0', size: 180, left: 5, top: 60, bx: -25, by: 20, bx2: 10, by2: -15, dur: 10, delay: 2 },
    { color: '#c8e8f4', size: 160, left: 60, top: 75, bx: 20, by: -30, bx2: -10, by2: 20, dur: 14, delay: 4 },
    { color: '#ede3cc', size: 140, left: 20, top: 20, bx: -15, by: 15, bx2: 20, by2: -10, dur: 11, delay: 1 },
  ];
  return (
    <>
      {blobData.map((b, i) => (
        <div
          key={i}
          className="auth-right-blob"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.color,
            left: `${b.left}%`,
            top: `${b.top}%`,
            '--bx': `${b.bx}px`,
            '--by': `${b.by}px`,
            '--bx2': `${b.bx2}px`,
            '--by2': `${b.by2}px`,
            '--dur': `${b.dur}s`,
            '--delay': `${b.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Floating school objects (right panel) ────────────────────────────
function AuthRightFloats() {
  const objs = Array.from({ length: 4 }, (_, i) => {
    const emoji = SCHOOL_EMOJIS[i % SCHOOL_EMOJIS.length];
    const size = 0.9 + (i * 0.17) % 0.8;
    const dur = 7 + (i * 1.3) % 7;
    const delay = (i * 1.1) % 10;
    const left = 3 + (i * 9.7) % 90;
    const top = 8 + (i * 11.3) % 85;
    const driftX = ((i % 2 === 0 ? 1 : -1) * (15 + (i * 7) % 45));
    const driftY = -10 - (i * 5) % 40;
    const driftX2 = ((i % 2 === 0 ? -1 : 1) * (8 + (i * 5) % 30));
    const driftY2 = driftY - 8 - (i * 4) % 25;
    const rot = ((i % 2 === 0 ? 1 : -1) * (8 + (i * 6) % 25));
    const rot2 = ((i % 2 === 0 ? -1 : 1) * (4 + (i * 4) % 18));
    return { emoji, size, dur, delay, left, top, driftX, driftY, driftX2, driftY2, rot, rot2 };
  });

  return (
    <>
      {objs.map((o, i) => (
        <span
          key={i}
          className="auth-floating-obj"
          style={{
            left: `${o.left}%`,
            top: `${o.top}%`,
            fontSize: `${o.size}rem`,
            '--dur': `${o.dur}s`,
            '--delay': `${o.delay}s`,
            '--driftX': `${o.driftX}px`,
            '--driftY': `${o.driftY}px`,
            '--driftX2': `${o.driftX2}px`,
            '--driftY2': `${o.driftY2}px`,
            '--rot': `${o.rot}deg`,
            '--rot2': `${o.rot2}deg`,
          } as React.CSSProperties}
        >
          {o.emoji}
        </span>
      ))}
    </>
  );
}

// ── Arrow Icon ───────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);

// ── AuthLayout ───────────────────────────────────────────────────────
interface AuthLayoutProps {
  children: React.ReactNode;
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
      {/* ── Global fun canvas (bubbles + streaks + click pops) ──── */}
      <AuthFunCanvas />

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div className="auth-left">
        {/* Hero canvas: floating objects + shooting stars + geese */}
        <AuthHeroCanvas />

        <div className="auth-left__bg-image">
          <img src="/images/hero-bg.png" alt="Background" />
        </div>
        <div className="auth-left__dots" />
        <div className="auth-left__blob auth-left__blob--blue" />
        <div className="auth-left__blob auth-left__blob--purple" />
        <div className="auth-left__blob auth-left__blob--cyan" />

        <div className="auth-left__content">
          <Link to="/" className="auth-left__logo">
            <img
              src="/images/logo.png"
              alt="ALMA Logo"
              style={{ height: '48px', width: 'auto', objectFit: 'contain', background: 'white', borderRadius: '10px', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,.2)', marginRight: '12px' }}
            />
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

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="auth-right">
        {/* Animated glow orbs */}
        <div className="auth-right__glow auth-right__glow--top" />
        <div className="auth-right__glow auth-right__glow--bottom" />
        <div className="auth-right__glow auth-right__glow--green" />

        {/* Floating blobs */}
        <AuthRightBlobs />

        {/* Floating school emojis */}
        <AuthRightFloats />

        <div className="auth-form-wrapper">
          <div className="auth-card">
            <div className="auth-card__top-bar" />

            {/* Logo inside card */}
            <div className="auth-card__logo">
              <Link to="/">
                <img src="/images/logo.png" alt="ALMA Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
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
