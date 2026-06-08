import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import authApi from "../../features/auth/api/authApi";
import { useAuth } from "../../features/auth/context/AuthContext";
import { SearchOverlay } from "../../features/products";
import { cartApi } from "../../features/cart/api/cartApi";
import { resolveApiAssetUrl } from "../api/axiosClient";
import "../../features/home/pages/HomePage.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  const fetchCartCount = useCallback(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    cartApi.getMyCart()
      .then(cart => {
        if (cart && cart.items) {
          setCartCount(cart.items.length);
        } else {
          setCartCount(0);
        }
      })
      .catch(() => {
        setCartCount(0);
      });
  }, [user]);

  useEffect(() => {
    fetchCartCount();

    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [user, fetchCartCount]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    logout();
    toast.success("Đã đăng xuất!");
  };

  const isHomeActive = currentPath === "/";
  const isProductActive = currentPath.startsWith("/category") || currentPath.startsWith("/products");
  const isStoryActive = currentPath.startsWith("/Story") || currentPath.startsWith("/story");
  const isContactActive = currentPath.startsWith("/contact");
  const isCustomizerActive = currentPath.startsWith("/customizer");

  return (
    <>
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
            <Link 
              to="/" 
              className={`alma-nav__link ${isHomeActive ? "alma-nav__link--active" : ""}`}
            >
              Trang Chủ
            </Link>
            <Link 
              to="/category" 
              className={`alma-nav__link ${isProductActive ? "alma-nav__link--active" : ""}`}
            >
              Sản Phẩm
            </Link>
            <Link
              to="/Story"
              className={`alma-nav__link ${isStoryActive ? "alma-nav__link--active" : ""}`}
            >
              Câu chuyện
            </Link>
            <Link
              to="/contact"
              className={`alma-nav__link ${isContactActive ? "alma-nav__link--active" : ""}`}
            >
              Liên hệ
            </Link>
            <Link
              to="/customizer"
              className={`alma-nav__link alma-nav__link--design ${isCustomizerActive ? "alma-nav__link--active" : ""}`}
            >
              ✨ Thiết Kế Ngay
            </Link>
          </nav>

          <div className="alma-nav__actions">
            <button
              onClick={() => setSearchOpen(true)}
              className="alma-nav__icon-btn"
              aria-label="Search"
              type="button"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              🔍
            </button>
            <Link
              to="/cart"
              className="alma-nav__icon-btn alma-nav__cart"
              aria-label="Cart"
            >
              🛒{cartCount > 0 && <span className="alma-nav__badge">{cartCount}</span>}
            </Link>
            {user ? (
              <div className="alma-nav__user-menu">
                <Link to="/profile" className="alma-nav__login-btn">
                  {user.avatarUrl ? (
                    <img
                      src={resolveApiAssetUrl(user.avatarUrl) || ""}
                      alt="Avatar"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1.5px solid rgba(37, 99, 235, 0.2)",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                  <span>{user.fullName.split(" ").pop()}</span>
                </Link>
                <div className="alma-nav__dropdown">
                  <Link to="/profile" className="alma-nav__dropdown-item" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {user.avatarUrl ? (
                      <img
                        src={resolveApiAssetUrl(user.avatarUrl) || ""}
                        alt="Avatar"
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "1px solid rgba(0, 0, 0, 0.1)",
                        }}
                      />
                    ) : (
                      "👤"
                    )}
                    <span>Trang cá nhân</span>
                  </Link>
                  {user.role === "Admin" || user.role === "Product Manager" ? (
                    <Link to="/admin" className="alma-nav__dropdown-item">
                      🛠️ Trang quản trị
                    </Link>
                  ) : (
                    <>
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
            <Link to="/contact" onClick={() => setMobileOpen(false)}>Liên hệ</Link>
            <Link to="/customizer" onClick={() => setMobileOpen(false)}>✨ Thiết Kế Ngay</Link>
            {user ? (
              <>
                <Link to="/profile" onClick={() => setMobileOpen(false)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {user.avatarUrl ? (
                    <img
                      src={resolveApiAssetUrl(user.avatarUrl) || ""}
                      alt="Avatar"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "1px solid rgba(0, 0, 0, 0.1)",
                      }}
                    />
                  ) : (
                    "👤"
                  )}
                  <span>Trang cá nhân</span>
                </Link>
                {user.role === "Admin" || user.role === "Product Manager" ? (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}>🛠️ Trang quản trị</Link>
                ) : (
                  <>
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
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
