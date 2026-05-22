import { Link } from "react-router-dom";
import "./ZaloFloat.css";

/**
 * Floating Zalo button — hiển thị cố định góc dưới phải trên mọi trang.
 * Click → chuyển sang trang /zalo (Zalo OA profile của ALMA).
 */
export default function ZaloFloat() {
  return (
    <Link to="/zalo" className="zalo-float" aria-label="Liên hệ Zalo ALMA">
      {/* Ripple animation */}
      <span className="zalo-float__ripple" />
      <span className="zalo-float__ripple zalo-float__ripple--delay" />

      {/* Zalo icon SVG */}
      <svg
        className="zalo-float__icon"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="48" height="48" rx="24" fill="#0068FF" />
        <text
          x="50%"
          y="55%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontFamily="Arial Black, sans-serif"
          fontWeight="900"
          fontSize="16"
          fill="#fff"
        >
          Zalo
        </text>
      </svg>

      {/* Tooltip */}
      <span className="zalo-float__tooltip">Chat Zalo với ALMA!</span>
    </Link>
  );
}
