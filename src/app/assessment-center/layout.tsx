import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const assessmentCenterSidebarItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "fa-solid fa-table-columns",
    href: "/assessment-center/dashboard",
  },
  {
    key: "applicants",
    label: "Applicants",
    icon: "fa-solid fa-users",
    href: "/assessment-center/applicants",
  },
];

export default async function AssessmentCenterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserRole("assessment_center");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <DashboardSidebar items={assessmentCenterSidebarItems} portalLabel="Assessment Center Portal" />
      {children}
    </div>
  );
}
