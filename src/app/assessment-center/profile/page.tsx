import { notFound } from "next/navigation";
import UserProfilePage from "@/components/UserProfilePage";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadUserProfileView } from "@/lib/user-profile";

export default async function AssessmentCenterProfilePage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "assessment_center") {
    notFound();
  }

  const profileView = await loadUserProfileView(currentUser);

  return <UserProfilePage currentUser={currentUser} profileView={profileView} />;
}
