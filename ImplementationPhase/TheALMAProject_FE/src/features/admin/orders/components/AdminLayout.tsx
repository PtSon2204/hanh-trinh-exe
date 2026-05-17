import type { ReactNode } from "react";
import { AdminShell } from "../../components/AdminShell";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell activePath="/admin/orders">{children}</AdminShell>;
}
