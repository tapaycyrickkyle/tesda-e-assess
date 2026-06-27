import type { CurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type AssessmentCenterLinkStatus =
  | "email_conflict"
  | "legacy_email_match"
  | "linked"
  | "not_found";

type AssessmentCenterLookupRecord = {
  center_auth_user_id?: string | null;
  center_email?: string | null;
  id: string;
};

export type AssessmentCenterLookupResult<TRecord extends AssessmentCenterLookupRecord> = {
  center: TRecord | null;
  status: AssessmentCenterLinkStatus;
};

export function getAssessmentCenterLinkMessage(status: AssessmentCenterLinkStatus) {
  if (status === "email_conflict") {
    return "This assessment center record is already linked to a different login. Please ask the admin to relink the center account.";
  }

  if (status === "legacy_email_match") {
    return "This account is using a legacy email-based center link. Ask the admin to relink the assessment center record to this login for stricter account security.";
  }

  if (status === "not_found") {
    return "No assessment center record is linked to this account yet. Please contact the admin.";
  }

  return null;
}

function coerceAssessmentCenterLookupRecord<TRecord extends AssessmentCenterLookupRecord>(value: unknown): TRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  if (typeof (value as { id?: unknown }).id !== "string") {
    return null;
  }

  return value as TRecord;
}

export async function resolveAssessmentCenterForUser<TRecord extends AssessmentCenterLookupRecord>(
  currentUser: Pick<CurrentAppUser, "email" | "id">,
  selectFields: string,
): Promise<AssessmentCenterLookupResult<TRecord>> {
  try {
    const adminSupabase = createSupabaseAdminClient();
    const normalizedEmail = currentUser.email.trim().toLowerCase();

    const { data: centerByAuthId, error: centerByAuthIdError } = await adminSupabase
      .from("assessment_centers")
      .select(selectFields)
      .eq("center_auth_user_id", currentUser.id)
      .maybeSingle();

    if (centerByAuthIdError) {
      return { center: null, status: "not_found" };
    }

    const typedCenterByAuthId = coerceAssessmentCenterLookupRecord<TRecord>(centerByAuthId);

    if (typedCenterByAuthId) {
      return { center: typedCenterByAuthId, status: "linked" };
    }

    const { data: centerByEmail, error: centerByEmailError } = await adminSupabase
      .from("assessment_centers")
      .select(selectFields)
      .eq("center_email", normalizedEmail)
      .maybeSingle();

    if (centerByEmailError) {
      return { center: null, status: "not_found" };
    }

    const typedCenterByEmail = coerceAssessmentCenterLookupRecord<TRecord>(centerByEmail);

    if (!typedCenterByEmail) {
      return { center: null, status: "not_found" };
    }

    if (typedCenterByEmail.center_auth_user_id && typedCenterByEmail.center_auth_user_id !== currentUser.id) {
      return { center: null, status: "email_conflict" };
    }

    return { center: typedCenterByEmail, status: "legacy_email_match" };
  } catch {
    return { center: null, status: "not_found" };
  }
}
