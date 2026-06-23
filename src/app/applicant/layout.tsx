import DashboardSidebar from "@/components/DashboardSidebar";
import { requireCurrentAppUserRole } from "@/lib/server-auth";

const applicantSidebarItems = [
  { key: "overview", label: "Overview", icon: "fa-solid fa-table-columns", href: "/applicant/overview" },
  { key: "apply", label: "Apply", icon: "fa-regular fa-file-lines", href: "/applicant/apply" },
  { key: "submissions", label: "Submissions", icon: "fa-solid fa-file-pdf", href: "/applicant/submissions" },
  { key: "inbox", label: "Inbox", icon: "fa-regular fa-bell", href: "/applicant/inbox" },
  { key: "rooms", label: "Rooms", icon: "fa-solid fa-door-open", href: "/applicant/rooms" },
  { key: "account", label: "Account", icon: "fa-regular fa-user", href: "/applicant/account" },
];

export default async function ApplicantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await requireCurrentAppUserRole("applicant");

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] selection:bg-[#0038a8] selection:text-white">
      <DashboardSidebar
        items={applicantSidebarItems}
        portalLabel="Applicant Portal"
        userAvatarUrl={currentUser?.avatarUrl ?? null}
        userEmail={currentUser?.email ?? ""}
      />
      {children}
    </div>
  );
}
