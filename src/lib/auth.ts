export const SESSION_COOKIE_NAME = "tesda_session";
export const USER_ROLE_COOKIE_NAME = "tesda_user_role";

export type UserRole = "admin" | "assessment_center" | "student" | "teacher" | "unknown";
type AuthMetadata = Record<string, unknown> | null | undefined;
type AuthValue = string | number | boolean | Record<string, unknown> | AuthValue[] | null | undefined;

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseRoleLookupConfig() {
  return {
    tableName: process.env.SUPABASE_USER_ROLE_TABLE ?? "profiles",
    emailColumn: process.env.SUPABASE_USER_ROLE_EMAIL_COLUMN ?? "email",
    roleColumn: process.env.SUPABASE_USER_ROLE_COLUMN ?? "role",
  };
}

export function normalizeUserRole(roleValue: string | null | undefined): UserRole {
  const normalized = roleValue
    ?.trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (!normalized) {
    return "unknown";
  }

  if (
    normalized === "admin" ||
    normalized === "administrator" ||
    normalized === "super_admin" ||
    normalized.includes("admin")
  ) {
    return "admin";
  }

  if (
    normalized === "student" ||
    normalized === "applicant" ||
    normalized === "learner" ||
    normalized === "trainee" ||
    normalized.includes("student") ||
    normalized.includes("applicant") ||
    normalized.includes("learner") ||
    normalized.includes("trainee")
  ) {
    return "student";
  }

  if (
    normalized === "teacher" ||
    normalized === "instructor" ||
    normalized === "assessor" ||
    normalized === "trainer" ||
    normalized.includes("teacher") ||
    normalized.includes("instructor") ||
    normalized.includes("assessor") ||
    normalized.includes("trainer")
  ) {
    return "teacher";
  }

  if (
    normalized === "assessment_center" ||
    normalized === "assessment_centre" ||
    normalized === "assessmentcenter" ||
    normalized === "assessmentcentre" ||
    normalized === "center" ||
    normalized === "centre" ||
    normalized.includes("assessment_center") ||
    normalized.includes("assessmentcentre") ||
    normalized.includes("assessment center") ||
    normalized.includes("assessment centre")
  ) {
    return "assessment_center";
  }

  return "unknown";
}

function readRoleCandidate(metadata: AuthMetadata, key: string) {
  return metadata?.[key] as AuthValue;
}

function collectRoleStrings(value: AuthValue, seen = new Set<unknown>()): string[] {
  if (value == null || seen.has(value)) {
    return [];
  }

  if (typeof value === "string") {
    return [value];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [String(value)];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectRoleStrings(item, seen));
  }

  const entries = Object.entries(value);
  const prioritized = entries.filter(([key]) =>
    ["role", "roles", "user_role", "account_role", "account_type", "type", "userType"].includes(key),
  );
  const remaining = entries.filter(([key]) =>
    !["role", "roles", "user_role", "account_role", "account_type", "type", "userType"].includes(key),
  );

  return [...prioritized, ...remaining].flatMap(([, nestedValue]) => collectRoleStrings(nestedValue as AuthValue, seen));
}

export function getUserRoleFromMetadata(user: {
  user_metadata?: AuthMetadata;
  app_metadata?: AuthMetadata;
}) {
  const candidates = [
    readRoleCandidate(user.user_metadata, "role"),
    readRoleCandidate(user.user_metadata, "roles"),
    readRoleCandidate(user.user_metadata, "user_role"),
    readRoleCandidate(user.user_metadata, "account_role"),
    readRoleCandidate(user.user_metadata, "account_type"),
    readRoleCandidate(user.user_metadata, "type"),
    user.user_metadata,
    readRoleCandidate(user.app_metadata, "role"),
    readRoleCandidate(user.app_metadata, "roles"),
    readRoleCandidate(user.app_metadata, "user_role"),
    readRoleCandidate(user.app_metadata, "account_role"),
    readRoleCandidate(user.app_metadata, "account_type"),
    readRoleCandidate(user.app_metadata, "type"),
    user.app_metadata,
  ];

  for (const candidate of candidates) {
    for (const value of collectRoleStrings(candidate)) {
      const role = normalizeUserRole(value);
      if (role !== "unknown") {
        return role;
      }
    }
  }

  return "unknown";
}

export function getRoleHomePath(role: UserRole) {
  if (role === "admin") {
    return "/admin/dashboard";
  }

  if (role === "student") {
    return "/applicant/dashboard";
  }

  if (role === "teacher") {
    return "/teacher/dashboard";
  }

  if (role === "assessment_center") {
    return "/assessment-center/dashboard";
  }

  return "/";
}
