import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseRoleLookupConfig, normalizeUserRole, type UserRole } from "@/lib/auth";

function createBaseSupabaseClient(accessToken?: string) {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

function createBaseSupabaseBrowserClient() {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export function createSupabaseServerClient() {
  return createBaseSupabaseClient();
}

export function createSupabaseAccessTokenClient(accessToken: string) {
  return createBaseSupabaseClient(accessToken);
}

export function createSupabaseBrowserClient() {
  return createBaseSupabaseBrowserClient();
}

export function createSupabaseAdminClient() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function getUserRoleFromRoleTable(email: string, accessToken?: string): Promise<UserRole> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return "unknown";
  }

  const { tableName, emailColumn, roleColumn } = getSupabaseRoleLookupConfig();
  const supabase = accessToken ? createSupabaseAccessTokenClient(accessToken) : createSupabaseServerClient();
  const { data, error } = await supabase
    .from(tableName)
    .select(roleColumn)
    .eq(emailColumn, normalizedEmail)
    .maybeSingle();

  if (error || !data) {
    return "unknown";
  }

  if (typeof data !== "object" || Array.isArray(data)) {
    return "unknown";
  }

  const rawRole = (data as Record<string, unknown>)[roleColumn];
  return typeof rawRole === "string" ? normalizeUserRole(rawRole) : "unknown";
}

export async function getUserApprovalStatusFromProfile(email: string, accessToken?: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  const supabase = accessToken ? createSupabaseAccessTokenClient(accessToken) : createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("approval_status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }

  const approvalStatus = (data as Record<string, unknown>).approval_status;
  return typeof approvalStatus === "string" ? approvalStatus : null;
}
