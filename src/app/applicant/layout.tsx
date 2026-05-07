import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const applicantSidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-table-columns", href: "/applicant/dashboard" },
  { key: "applications", label: "Applications", icon: "fa-regular fa-file-lines", href: "/applicant/applications" },
  { key: "verification", label: "Verification", icon: "fa-solid fa-user-check", href: "/applicant/verification" },
  { key: "evaluations", label: "Evaluations", icon: "fa-regular fa-star", href: "/applicant/evaluations" },
  { key: "reports", label: "Reports", icon: "fa-solid fa-chart-line", href: "/applicant/reports" },
  { key: "settings", label: "System Settings", icon: "fa-solid fa-sliders", href: "/applicant/settings" },
];

export default async function ApplicantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUserRole("student");
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30]">
      <DashboardSidebar items={applicantSidebarItems} portalLabel="Applicant Portal" />
      {children}
    </div>
  );
}
