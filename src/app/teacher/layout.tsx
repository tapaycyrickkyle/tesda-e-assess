import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const teacherSidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-table-columns", href: "/teacher/dashboard" },
  { key: "classes", label: "Room", icon: "fa-solid fa-chalkboard-user", href: "/teacher/classes" },
];

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserRole("teacher");
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <DashboardSidebar items={teacherSidebarItems} portalLabel="Teacher Portal" />
      {children}
    </div>
  );
}
