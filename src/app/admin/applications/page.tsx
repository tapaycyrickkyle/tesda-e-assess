import PortalSectionPage from "@/components/PortalSectionPage";

export default function AdminApplicationsPage() {
  return (
    <PortalSectionPage
      description="Review applicant submissions, track intake progress, and manage the next steps for incoming records."
      portalLabel="Admin Applications"
      primaryActionLabel="Review Queue"
      secondaryActionLabel="Export Records"
      title="Applications"
    />
  );
}
