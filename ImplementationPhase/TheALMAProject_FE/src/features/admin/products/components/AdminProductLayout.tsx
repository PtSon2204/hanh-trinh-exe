import { Component, type ErrorInfo, type ReactNode } from "react";
import { AdminShell } from "../../components/AdminShell";

interface AdminProductLayoutProps {
  children: ReactNode;
  activePath: "/admin/base-products" | "/admin/products" | "/admin/stickers";
}

interface AdminProductErrorBoundaryProps {
  children: ReactNode;
}

interface AdminProductErrorBoundaryState {
  hasError: boolean;
}

class AdminProductErrorBoundary extends Component<
  AdminProductErrorBoundaryProps,
  AdminProductErrorBoundaryState
> {
  state: AdminProductErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AdminProductErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin product page failed to render", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="admin-orders-page admin-products-page">
          <div className="admin-alert" role="alert">
            Không thể hiển thị trang quản lý sản phẩm. Vui lòng tải lại trang hoặc thử lại sau.
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export function AdminProductLayout({
  activePath,
  children,
}: AdminProductLayoutProps) {
  return (
    <AdminShell
      activePath={activePath}
      searchPlaceholder="Tìm phôi, sản phẩm, chất liệu..."
    >
      <AdminProductErrorBoundary>{children}</AdminProductErrorBoundary>
    </AdminShell>
  );
}
