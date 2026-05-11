import DashboardSidebar from "@/components/DashboardSidebar";
import { requireUserRole } from "@/lib/server-auth";

const applicantSidebarItems = [
  { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-table-columns", href: "/applicant/dashboard" },
  { key: "applications", label: "Applications", icon: "fa-regular fa-file-lines", href: "/applicant/applications" },
  { key: "submitted-forms", label: "Submitted Forms", icon: "fa-solid fa-file-pdf", href: "/applicant/submitted-forms" },
  { key: "room", label: "Room", icon: "fa-solid fa-door-open", href: "/applicant/room" },
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
