import DashboardSidebar from "@/components/DashboardSidebar";
import { getCurrentAppUser } from "@/lib/current-user";
import { requireUserRole } from "@/lib/server-auth";

const teacherSidebarItems = [
  { key: "overview", label: "Overview", icon: "fa-solid fa-table-columns", href: "/teacher/overview" },
  { key: "rooms", label: "Rooms", icon: "fa-solid fa-chalkboard-user", href: "/teacher/rooms" },
  { key: "inbox", label: "Inbox", icon: "fa-regular fa-bell", href: "/teacher/inbox" },
  { key: "account", label: "Account", icon: "fa-regular fa-user", href: "/teacher/account" },
];

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserRole("teacher");
  const currentUser = await getCurrentAppUser();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#0038a8] selection:text-white">
      <DashboardSidebar
        items={teacherSidebarItems}
        portalLabel="Teacher Portal"
        userAvatarUrl={currentUser?.avatarUrl ?? null}
        userEmail={currentUser?.email ?? ""}
      />
      {children}
    </div>
  );
}
