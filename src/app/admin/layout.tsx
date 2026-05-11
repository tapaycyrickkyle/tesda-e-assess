import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const adminSidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-pie", href: "/admin/dashboard" },
  { key: "applicants", label: "Applicants", icon: "fa-solid fa-users", href: "/admin/applicants" },
  {
    key: "assigned-applicants",
    label: "Assigned Applicants",
    icon: "fa-solid fa-user-check",
    href: "/admin/assigned-applicants",
  },
  { key: "teacher-approvals", label: "Teacher Approvals", icon: "fa-solid fa-user-check", href: "/admin/teacher-approvals" },
  {
    key: "assessment-center",
    label: "Assessment Center",
    icon: "fa-solid fa-building",
    href: "/admin/assessment-center",
  },
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
