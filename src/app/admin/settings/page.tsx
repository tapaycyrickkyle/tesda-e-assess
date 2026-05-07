import PortalSectionPage from "@/components/PortalSectionPage";

export default function AdminSettingsPage() {
  return (
    <PortalSectionPage
      description="Configure system preferences, update portal controls, and manage the administrative setup of the platform."
      portalLabel="Admin Settings"
      primaryActionLabel="Open Settings"
      secondaryActionLabel="View Access Rules"
      title="System Settings"
    />
  );
}
