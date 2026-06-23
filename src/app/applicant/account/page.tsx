import UserProfilePage from "@/components/UserProfilePage";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { loadUserProfileView } from "@/lib/user-profile";

export default async function ApplicantProfilePage() {
  const currentUser = await requireCurrentAppUserRole("applicant");

  const profileView = await loadUserProfileView(currentUser);

  return <UserProfilePage currentUser={currentUser} profileView={profileView} />;
}
