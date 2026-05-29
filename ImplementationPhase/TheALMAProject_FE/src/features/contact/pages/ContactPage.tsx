import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import emailjs from "@emailjs/browser";
import Navbar from "../../../shared/components/Navbar";
import Footer from "../../../shared/components/Footer";
import "./ContactPage.css";

// ── EmailJS keys (đặt trong .env) ──────────────────────────────────────
const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;


// ── Contact Body ───────────────────────────────────────────────────────
const INFO_CARDS = [
  {
    icon: "📍",
    gradient: "linear-gradient(135deg,#3b82f6,#6366f1)",
    shadow: "rgba(99,102,241,.35)",
    title: "Địa Chỉ",
    lines: ["Khu Công nghệ cao Hòa Lạc", "Thạch Thất, Hà Nội, Việt Nam"],
    link: null,
  },
  {
    icon: "📞",
    gradient: "linear-gradient(135deg,#22c55e,#16a34a)",
    shadow: "rgba(34,197,94,.35)",
    title: "Điện Thoại",
    lines: ["0123 456 789", "Thứ 2 – Thứ 7 | 8:00 – 17:30"],
    link: "tel:0123456789",
  },
  {
    icon: "✉️",
    gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
    shadow: "rgba(245,158,11,.35)",
    title: "Email",
    lines: ["contact@almacustom.vn", "Phản hồi trong vòng 24h"],
    link: "mailto:contact@almacustom.vn",
  },
  {
    icon: "⏰",
    gradient: "linear-gradient(135deg,#a855f7,#6366f1)",
    shadow: "rgba(168,85,247,.35)",
    title: "Giờ Làm Việc",
    lines: ["Thứ 2 – Thứ 7: 8:00 – 17:30", "Chủ Nhật: 9:00 – 12:00"],
    link: null,
  },
];

const SOCIAL_LINKS = [
  { icon: "f", label: "Facebook", href: "https://facebook.com", color: "#1877F2" },
  { icon: "📷", label: "Instagram", href: "https://instagram.com", color: "#E4405F" },
  { icon: "♪", label: "TikTok", href: "https://tiktok.com", color: "#000" },
];

function ContactBody() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  // Khởi tạo EmailJS 1 lần khi component mount
  useEffect(() => {
    if (EJS_KEY) emailjs.init(EJS_KEY);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    // Kiểm tra đã cấu hình .env chưa
    if (!EJS_SERVICE || !EJS_TEMPLATE || !EJS_KEY) {
      toast.error("Chưa cấu hình EmailJS. Vui lòng xem hướng dẫn trong emailjs_setup.md");
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        EJS_SERVICE,
        EJS_TEMPLATE,
        {
          // Tên biến phải khớp CHÍNH XÁC với {{...}} trong EmailJS Template
          name:    form.name,                          // → {{name}}
          email:   form.email,                         // → {{email}} (dùng cho Reply To)
          title:   `Liên hệ từ ${form.name}`,          // → {{title}} (subject)
          phone:   form.phone || "Không cung cấp",     // → {{phone}}
          message: form.message,                       // → {{message}}
          time:    new Date().toLocaleString("vi-VN"), // → {{time}}
        }
      );
      toast.success("✅ Đã gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      console.error("EmailJS error:", err);
      toast.error("❌ Gửi thất bại. Vui lòng thử lại hoặc liên hệ trực tiếp qua email!");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="contact-page">
      {/* ── Hero Banner ── */}
      <section className="contact-hero">
        <div className="contact-hero__blob contact-hero__blob--blue" />
        <div className="contact-hero__blob contact-hero__blob--purple" />
        <div className="contact-hero__content">
          <span className="contact-hero__eyebrow">📬 Liên Hệ Với Chúng Tôi</span>
          <h1 className="contact-hero__title">Chúng tôi luôn<br />sẵn sàng hỗ trợ bạn</h1>
          <p className="contact-hero__sub">
            Có câu hỏi về thiết kế, đơn hàng hoặc cần tư vấn? Đừng ngại liên hệ — đội ngũ ALMA luôn ở đây!
          </p>
        </div>
      </section>

      {/* ── Main 2-col layout ── */}
      <section className="contact-main">
        <div className="contact-main__container">

          {/* LEFT — Thông tin liên hệ */}
          <div className="contact-left">
            {/* Info Cards */}
            <div className="contact-info-grid">
              {INFO_CARDS.map(card => (
                <div key={card.title} className="contact-info-card">
                  <div
                    className="contact-info-card__icon"
                    style={{ background: card.gradient, boxShadow: `0 8px 24px ${card.shadow}` }}
                  >
                    {card.icon}
                  </div>
                  <div className="contact-info-card__body">
                    <h3 className="contact-info-card__title">{card.title}</h3>
                    {card.lines.map((line, i) =>
                      i === 0 && card.link ? (
                        <a key={i} href={card.link} className="contact-info-card__main">{line}</a>
                      ) : (
                        <p key={i} className={i === 0 ? "contact-info-card__main" : "contact-info-card__sub"}>{line}</p>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div className="contact-socials">
              <h3 className="contact-socials__title">Theo dõi chúng tôi</h3>
              <div className="contact-socials__links">
                {SOCIAL_LINKS.map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-social-btn"
                    style={{ "--social-color": s.color } as React.CSSProperties}
                    aria-label={s.label}
                  >
                    <span className="contact-social-btn__icon">{s.icon}</span>
                    <span className="contact-social-btn__label">{s.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Form gửi tin nhắn */}
            <div className="contact-form-card">
              <div className="contact-form-card__header">
                <h3 className="contact-form-card__title">💬 Gửi Tin Nhắn</h3>
                <p className="contact-form-card__sub">Điền form bên dưới — chúng tôi sẽ phản hồi trong 24h</p>
              </div>
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="contact-form__row">
                  <div className="contact-form__field">
                    <label className="contact-form__label">Họ và tên <span>*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="contact-form__input"
                      required
                    />
                  </div>
                  <div className="contact-form__field">
                    <label className="contact-form__label">Email <span>*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="contact-form__input"
                      required
                    />
                  </div>
                </div>
                <div className="contact-form__field">
                  <label className="contact-form__label">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="0123 456 789"
                    className="contact-form__input"
                  />
                </div>
                <div className="contact-form__field">
                  <label className="contact-form__label">Nội dung tin nhắn <span>*</span></label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tôi muốn hỏi về việc đặt áo lớp cho 40 học sinh..."
                    className="contact-form__textarea"
                    required
                  />
                </div>
                <button type="submit" className="contact-form__btn" disabled={sending}>
                  {sending ? (
                    <><span className="contact-form__spinner" /> Đang gửi...</>
                  ) : (
                    <>✈️ Gửi Tin Nhắn</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT — Google Map */}
          <div className="contact-right">
            <div className="contact-map-card">
              <div className="contact-map-card__header">
                <h3 className="contact-map-card__title">📍 Vị Trí Của Chúng Tôi</h3>
                <p className="contact-map-card__sub">Khu CNC Hòa Lạc, Thạch Thất, Hà Nội</p>
              </div>
              <div className="contact-map-card__map">
                <iframe
                  title="ALMA Custom Threads Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.4462671975755!2d105.52219827465258!3d21.01293618917576!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x313454b10b088a0b%3A0x1e1d8eca88c96f0b!2sKhu%20C%C3%B4ng%20ngh%E1%BB%87%20cao%20H%C3%B2a%20L%E1%BA%A1c!5e0!3m2!1svi!2svn!4v1716376200000!5m2!1svi!2svn"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="contact-map-card__footer">
                <a
                  href="https://maps.google.com/?q=Khu+Cong+nghe+cao+Hoa+Lac+Ha+Noi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-map-card__btn"
                >
                  🗺️ Mở trong Google Maps
                </a>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="contact-stats">
              {[
                { num: "< 24h", label: "Thời gian phản hồi" },
                { num: "500+", label: "Trường đã hợp tác" },
                { num: "10K+", label: "Áo đã sản xuất" },
              ].map(s => (
                <div key={s.label} className="contact-stat">
                  <p className="contact-stat__num">{s.num}</p>
                  <p className="contact-stat__label">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ── Page export ────────────────────────────────────────────────────────
export default function ContactPage() {
  return (
    <div style={{ fontFamily: "'Trebuchet MS', Arial, sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <ContactBody />
      <Footer />
    </div>
  );
}
