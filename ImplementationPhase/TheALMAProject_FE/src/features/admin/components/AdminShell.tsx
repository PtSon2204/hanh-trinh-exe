import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRightFromBracket,
  faBell,
  faBoxesStacked,
  faCartPlus,
  faFaceSmile,
  faGear,
  faHouse,
  faMagnifyingGlass,
  faPalette,
  faShirt,
  faTableColumns,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type ReactNode, useState } from "react";
import { useAuth } from "../../auth";
import authApi from "../../auth/api/authApi";
import "./admin.css";

type AdminNavItem = {
  href: string;
  icon: IconDefinition;
  label: string;
  badge?: string;
};

type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

interface AdminShellProps {
  children: ReactNode;
  activePath?: string;
  searchPlaceholder?: string;
}

const navGroups: AdminNavGroup[] = [
  {
    title: "Quản lý chính",
    items: [
      { href: "/admin", icon: faTableColumns, label: "Tổng quan (Dashboard)" },
      {
        href: "/admin/orders/new",
        icon: faCartPlus,
        label: "Đơn hàng mới",
        badge: "12",
      },
      { href: "/admin/orders", icon: faBoxesStacked, label: "Tất cả Đơn hàng" },
      { href: "/admin/designs", icon: faPalette, label: "Mẫu thiết kế User" },
    ],
  },
  {
    title: "Dữ liệu & Cấu hình",
    items: [
      {
        href: "/admin/base-products",
        icon: faShirt,
        label: "Quản lý phôi",
      },
      {
        href: "/admin/products",
        icon: faBoxesStacked,
        label: "Quản lý sản phẩm",
      },
      { href: "/admin/stickers", icon: faFaceSmile, label: "Quản lý Stickers" },
      { href: "/admin/customers", icon: faUsers, label: "Khách hàng" },
      { href: "/admin/notifications", icon: faBell, label: "Gửi Thông Báo" },
      { href: "/admin/settings", icon: faGear, label: "Cài đặt hệ thống" },
    ],
  },
];

function formatAdminDate() {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export function AdminShell({
  children,
  activePath = window.location.pathname,
  searchPlaceholder = "Tìm mã đơn hàng, email khách...",
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    logout();
  };

	const profileName = user?.fullName?.trim() || "Mama mia";
	const initials = profileName
		.split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-shell">
      <button
        className={`admin-backdrop ${sidebarOpen ? "is-visible" : ""}`}
        type="button"
        aria-label="Đóng menu quản trị"
        onClick={closeSidebar}
      />

      <aside
        className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}
        aria-label="Điều hướng quản trị"
      >
        <div className="admin-brand">
          <a className="admin-brand__link" href="/admin" onClick={closeSidebar}>
            <img
              src="/images/logo.png"
              alt="ALMA Logo"
              className="alma-nav__logo"
            />
            <span className="admin-brand__name">ALMA Admin</span>
          </a>
          <button
            className="admin-sidebar__close"
            type="button"
            onClick={closeSidebar}
            aria-label="Đóng sidebar"
          >
            ×
          </button>
        </div>

        <div className="admin-sidebar__scroll">
          {navGroups.map((group) => (
            <section className="admin-nav-group" key={group.title}>
              <p className="admin-nav-group__title">{group.title}</p>
              <nav className="admin-nav" aria-label={group.title}>
                {group.items.map((item) => {
                  const isActive = activePath === item.href;

                  return (
                    <a
                      className={`admin-nav__item ${isActive ? "is-active" : ""}`}
                      href={item.href}
                      key={item.href}
                      onClick={closeSidebar}
                    >
                      <span className="admin-nav__icon" aria-hidden="true">
                        <FontAwesomeIcon icon={item.icon} />
                      </span>
                      <span className="admin-nav__label">{item.label}</span>
                      {item.badge ? (
                        <span className="admin-nav__badge">{item.badge}</span>
                      ) : null}
                    </a>
                  );
                })}
              </nav>
            </section>
          ))}
        </div>

        <div className="admin-profile">
          <a
            className="admin-profile__identity"
            href="/profile"
            onClick={closeSidebar}
          >
            <span className="admin-profile__avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="admin-profile__meta">
				<strong>{profileName}</strong>
            </span>
          </a>
          <div className="admin-profile__actions">
            <a href="/" className="admin-profile__action" onClick={closeSidebar}>
              <FontAwesomeIcon icon={faHouse} /> Về trang chủ
            </a>
            <a href="/" onClick={handleLogout} className="admin-profile__action">
              <FontAwesomeIcon icon={faArrowRightFromBracket} /> Đăng xuất
            </a>
          </div>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              className="admin-menu-button"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu quản trị"
            >
              ☰
            </button>
            <label className="admin-search">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
              <span className="sr-only">Tìm kiếm trong trang quản trị</span>
              <input type="search" placeholder={searchPlaceholder} />
            </label>
          </div>

          <div className="admin-topbar__right">
            <button
              className="admin-notification"
              type="button"
              aria-label="Thông báo mới"
            >
              <FontAwesomeIcon icon={faBell} />
              <span className="admin-notification__dot" />
            </button>
            <span className="admin-topbar__divider" aria-hidden="true" />
            <time className="admin-date" dateTime={new Date().toISOString()}>
              {formatAdminDate()}
            </time>
          </div>
        </header>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
