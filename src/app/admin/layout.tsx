import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const adminSidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-pie", href: "/admin/dashboard" },
  { key: "applications", label: "Applications", icon: "fa-regular fa-file-lines", href: "/admin/applications" },
  { key: "verification", label: "Verification", icon: "fa-solid fa-user-check", href: "/admin/verification" },
  { key: "evaluations", label: "Evaluations", icon: "fa-regular fa-star", href: "/admin/evaluations" },
  { key: "reports", label: "Reports", icon: "fa-solid fa-chart-line", href: "/admin/reports" },
  { key: "settings", label: "System Settings", icon: "fa-solid fa-sliders", href: "/admin/settings" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserRole("admin");
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#0038a8] selection:text-white">
      <DashboardSidebar items={adminSidebarItems} portalLabel="Eastern Samar Office" />
      {children}
    </div>
  );
}
