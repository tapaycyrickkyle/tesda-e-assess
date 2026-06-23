import UserProfilePage from "@/components/UserProfilePage";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { loadUserProfileView } from "@/lib/user-profile";

export default async function AdminProfilePage() {
  const currentUser = await requireCurrentAppUserRole("admin");

  const profileView = await loadUserProfileView(currentUser);

  return <UserProfilePage currentUser={currentUser} profileView={profileView} />;
}
