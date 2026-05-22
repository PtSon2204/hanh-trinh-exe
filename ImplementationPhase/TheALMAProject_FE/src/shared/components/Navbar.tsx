import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import authApi from "../../features/auth/api/authApi";
import { useAuth } from "../../features/auth/context/AuthContext";
import { SearchOverlay } from "../../features/products";
import { cartApi } from "../../features/cart/api/cartApi";
import "../../features/home/pages/HomePage.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
