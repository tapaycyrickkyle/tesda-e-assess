import DashboardSidebar from "@/components/DashboardSidebar";
import { requireCurrentAppUserRole } from "@/lib/server-auth";

const adminSidebarItems = [
  { key: "overview", label: "Overview", icon: "fa-solid fa-chart-pie", href: "/admin/overview" },
  { key: "queue", label: "Queue", icon: "fa-solid fa-users", href: "/admin/queue" },
  {
    key: "assignments",
    label: "Assignments",
    icon: "fa-solid fa-user-check",
    href: "/admin/assignments",
  },
  {
    key: "teachers",
    label: "Teachers",
    icon: "fa-solid fa-chalkboard-user",
    href: "/admin/teachers",
  },
  {
    key: "centers",
    label: "Centers",
    icon: "fa-solid fa-building",
    href: "/admin/centers",
  },
  {
    key: "programs",
    label: "Programs",
    icon: "fa-solid fa-list-check",
    href: "/admin/programs",
  },
  {
    key: "reports",
    label: "Reports",
    icon: "fa-solid fa-file-export",
    href: "/admin/reports",
  },
  { key: "inbox", label: "Inbox", icon: "fa-regular fa-bell", href: "/admin/inbox" },
  { key: "account", label: "Account", icon: "fa-regular fa-user", href: "/admin/account" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await requireCurrentAppUserRole("admin");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#0038a8] selection:text-white">
      <DashboardSidebar
        items={adminSidebarItems}
        portalLabel="Eastern Samar Office"
        userAvatarUrl={currentUser?.avatarUrl ?? null}
        userEmail={currentUser?.email ?? ""}
      />
      {children}
    </div>
  );
}
