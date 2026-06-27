import { cookies } from "next/headers";
import { createSupabaseServerClient, getUserApprovalStatusFromProfile, getUserRoleFromRoleTable } from "@/lib/supabase";
import { getUserRoleFromMetadata, SESSION_COOKIE_NAME, type UserRole } from "@/lib/auth";

export type CurrentAppUser = {
  accessToken: string;
  avatarUrl: string | null;
  email: string;
  id: string;
  role: UserRole;
};

function normalizeAvatarUrl(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getUserAvatarUrl(user: {
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}) {
  const candidates = [
    user.user_metadata?.avatar_url,
    user.user_metadata?.picture,
    user.user_metadata?.photo_url,
    user.app_metadata?.avatar_url,
    user.app_metadata?.picture,
  ];

  for (const candidate of candidates) {
    const avatarUrl = normalizeAvatarUrl(candidate);
    if (avatarUrl) {
      return avatarUrl;
    }
  }

  return null;
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  try {
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
      avatarUrl: getUserAvatarUrl(data.user),
      email: data.user.email,
      id: data.user.id,
      role,
    };
  } catch {
    return null;
  }
}
