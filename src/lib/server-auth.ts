import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, getUserRoleFromRoleTable } from "@/lib/supabase";
import { getUserRoleFromMetadata, SESSION_COOKIE_NAME, type UserRole } from "@/lib/auth";

export async function requireUserRole(requiredRole: UserRole) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    redirect("/");
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser(sessionToken);

  if (error || !data.user) {
    redirect("/");
  }

  const metadataRole = getUserRoleFromMetadata(data.user);
  const currentRole =
    metadataRole !== "unknown"
      ? metadataRole
      : await getUserRoleFromRoleTable(data.user.email ?? "", sessionToken);

  if (currentRole !== requiredRole) {
    if (currentRole === "admin") {
      redirect("/admin/dashboard");
    }

    if (currentRole === "student") {
      redirect("/applicant/dashboard");
    }

    if (currentRole === "teacher") {
      redirect("/teacher/dashboard");
    }

    redirect("/");
  }
}
