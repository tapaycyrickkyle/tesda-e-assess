import UserProfilePage from "@/components/UserProfilePage";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { loadUserProfileView } from "@/lib/user-profile";

export default async function TeacherProfilePage() {
  const currentUser = await requireCurrentAppUserRole("teacher");

  const profileView = await loadUserProfileView(currentUser);

  return <UserProfilePage currentUser={currentUser} profileView={profileView} />;
}
