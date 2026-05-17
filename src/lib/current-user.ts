import { cookies } from "next/headers";
import { createSupabaseServerClient, getUserApprovalStatusFromProfile, getUserRoleFromRoleTable } from "@/lib/supabase";
import { getUserRoleFromMetadata, SESSION_COOKIE_NAME, type UserRole } from "@/lib/auth";

export type CurrentAppUser = {
  accessToken: string;
  email: string;
  id: string;
  role: UserRole;
};

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user?.id || !data.user.email) {
    return null;
  }

  const metadataRole = getUserRoleFromMetadata(data.user);
  const role =
    metadataRole !== "unknown"
      ? metadataRole
      : await getUserRoleFromRoleTable(data.user.email, accessToken);

  if (role === "unknown") {
    return null;
  }

  if (role === "teacher") {
    const approvalStatus = await getUserApprovalStatusFromProfile(data.user.email, accessToken);

    if (approvalStatus === "pending_review" || approvalStatus === "rejected") {
      return null;
    }
  }

  return {
    accessToken,
    email: data.user.email,
    id: data.user.id,
    role,
  };
}
