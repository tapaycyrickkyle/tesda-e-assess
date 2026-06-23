import DashboardSidebar from "@/components/DashboardSidebar";
import { requireCurrentAppUserRole } from "@/lib/server-auth";

const assessmentCenterSidebarItems = [
  {
    key: "overview",
    label: "Overview",
    icon: "fa-solid fa-table-columns",
    href: "/assessment-center/overview",
  },
  {
    key: "reviews",
    label: "Reviews",
    icon: "fa-solid fa-users",
    href: "/assessment-center/reviews",
  },
  {
    key: "closed",
    label: "Result Encoding",
    icon: "fa-solid fa-clipboard-check",
    href: "/assessment-center/closed",
  },
  {
    key: "reports",
    label: "Reports",
    icon: "fa-solid fa-file-export",
    href: "/assessment-center/reports",
  },
  {
    key: "inbox",
    label: "Inbox",
    icon: "fa-regular fa-bell",
    href: "/assessment-center/inbox",
  },
  {
    key: "account",
    label: "Account",
    icon: "fa-regular fa-user",
    href: "/assessment-center/account",
  },
];

export default async function AssessmentCenterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await requireCurrentAppUserRole("assessment_center");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#0038a8] selection:text-white">
      <DashboardSidebar
        items={assessmentCenterSidebarItems}
        portalLabel="Assessment Center Portal"
        userAvatarUrl={currentUser?.avatarUrl ?? null}
        userEmail={currentUser?.email ?? ""}
      />
      {children}
    </div>
  );
}
