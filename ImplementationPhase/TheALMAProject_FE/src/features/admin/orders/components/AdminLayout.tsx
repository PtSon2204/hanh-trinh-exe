import type { ReactNode } from "react";
import { AdminShell } from "../../components/AdminShell";

interface AdminLayoutProps {
  children: ReactNode;
  activePath?: string;
}

export function AdminLayout({ children, activePath = "/admin/orders" }: AdminLayoutProps) {
  return <AdminShell activePath={activePath}>{children}</AdminShell>;
}
