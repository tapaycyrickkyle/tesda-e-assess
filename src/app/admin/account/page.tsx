import { notFound } from "next/navigation";
import UserProfilePage from "@/components/UserProfilePage";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadUserProfileView } from "@/lib/user-profile";

export default async function AdminProfilePage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "admin") {
    notFound();
  }

  const profileView = await loadUserProfileView(currentUser);

  return <UserProfilePage currentUser={currentUser} profileView={profileView} />;
}
