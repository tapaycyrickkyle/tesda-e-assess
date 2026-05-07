import PortalSectionPage from "@/components/PortalSectionPage";

export default function AdminVerificationPage() {
  return (
    <PortalSectionPage
      description="Validate uploaded IDs, confirm institutional documents, and monitor teacher verification requests."
      portalLabel="Admin Verification"
      primaryActionLabel="Open Requests"
      secondaryActionLabel="View Audit Log"
      title="Verification"
    />
  );
}
