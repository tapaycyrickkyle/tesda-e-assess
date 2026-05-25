import { createSupabaseAdminClient } from "@/lib/supabase";

export type RegistrationRole = "applicant" | "teacher";

type ProfileSyncInput = {
  approvalStatus?: string;
  authUserId: string;
  contactNumber?: string | null;
  email: string;
  firstName?: string | null;
  fullName?: string | null;
  institutionName?: string | null;
  institutionType?: string | null;
  lastName?: string | null;
  middleName?: string | null;
  nameExtension?: string | null;
  positionTitle?: string | null;
  role: RegistrationRole;
};

export function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function normalizeOptionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

export function normalizeContactNumber(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("63")) {
    return `+${digits}`;
  }

  if (digits.startsWith("0")) {
    return `+63${digits.slice(1)}`;
  }

  return `+63${digits}`;
}

export function sanitizePhilippineMobileNumberAfterCountryCode(value: string | null | undefined) {
  let digits = (value ?? "").replace(/\D/g, "");

  if (digits.startsWith("63")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function isValidPhilippineMobileNumberInput(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (!digits) {
    return false;
  }

  if (/^9\d{9}$/.test(digits)) {
    return true;
  }

  if (/^09\d{9}$/.test(digits)) {
    return true;
  }

  return /^639\d{9}$/.test(digits);
}

export function formatPhilippineMobileNumberForLocalDisplay(value: string | null | undefined) {
  const digits = (value ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (/^09\d{9}$/.test(digits)) {
    return digits;
  }

  if (/^9\d{9}$/.test(digits)) {
    return `0${digits}`;
  }

  if (/^639\d{9}$/.test(digits)) {
    return `0${digits.slice(2)}`;
  }

  return value?.trim() ?? "";
}

export function buildFullName({
  firstName,
  lastName,
  middleName,
  nameExtension,
}: {
  firstName: string;
  lastName: string;
  middleName?: string | null;
  nameExtension?: string | null;
}) {
  return [
    firstName.trim(),
    normalizeOptionalText(middleName),
    lastName.trim(),
    normalizeOptionalText(nameExtension),
  ]
    .filter(Boolean)
    .join(" ");
}

function formatSupabaseError(error: {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
}) {
  return {
    code: error.code ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
    message: error.message ?? "Unknown Supabase error",
  };
}

export async function syncProfileRecord(input: ProfileSyncInput) {
  const adminSupabase = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    throw new Error("A valid email is required for profile sync.");
  }

  const profileRecord = {
    approval_status: input.approvalStatus ?? (input.role === "teacher" ? "pending_review" : "active"),
    contact_number: normalizeOptionalText(input.contactNumber ?? null),
    email: normalizedEmail,
    first_name: normalizeOptionalText(input.firstName ?? null),
    full_name: normalizeOptionalText(input.fullName ?? null),
    id: input.authUserId,
    institution_name: normalizeOptionalText(input.institutionName ?? null),
    institution_type: normalizeOptionalText(input.institutionType ?? null),
    last_name: normalizeOptionalText(input.lastName ?? null),
    middle_name: normalizeOptionalText(input.middleName ?? null),
    name_extension: normalizeOptionalText(input.nameExtension ?? null),
    position_title: normalizeOptionalText(input.positionTitle ?? null),
    role: input.role,
  };

  const { data: existingProfileById, error: lookupByIdError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("id", input.authUserId)
    .maybeSingle();

  if (lookupByIdError) {
    console.error("profiles lookup by id failed", formatSupabaseError(lookupByIdError));
    throw new Error(
      "Unable to verify the applicant profile by user id in the `profiles` table. Run the profile setup SQL and confirm the table allows the expected columns.",
    );
  }

  if (existingProfileById) {
    const { error: updateByIdError } = await adminSupabase
      .from("profiles")
      .update(profileRecord)
      .eq("id", input.authUserId);

    if (updateByIdError) {
      console.error("profiles update by id failed", formatSupabaseError(updateByIdError));
      throw new Error(
        "Unable to update the existing account in the `profiles` table. Run the profile setup SQL and confirm the table allows the expected columns.",
      );
    }

    return;
  }

  const { data: existingProfileByEmail, error: lookupByEmailError } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupByEmailError) {
    console.error("profiles lookup by email failed", formatSupabaseError(lookupByEmailError));
    throw new Error(
      "Unable to verify the applicant profile by email in the `profiles` table. Run the profile setup SQL and confirm the table allows the expected columns.",
    );
  }

  if (existingProfileByEmail) {
    const { error: updateByEmailError } = await adminSupabase
      .from("profiles")
      .update(profileRecord)
      .eq("email", normalizedEmail);

    if (updateByEmailError) {
      console.error("profiles update by email failed", formatSupabaseError(updateByEmailError));
      throw new Error(
        "Unable to update the existing account in the `profiles` table. Run the profile setup SQL and confirm the table allows the expected columns.",
      );
    }

    return;
  }

  const { error: insertError } = await adminSupabase.from("profiles").insert(profileRecord);

  if (insertError) {
    console.error("profiles insert failed", formatSupabaseError(insertError));
    throw new Error(
      "Unable to save the account to the `profiles` table. Run the profile setup SQL and confirm the table allows the expected columns.",
    );
  }
}

export async function deleteProfileByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return;
  }

  const adminSupabase = createSupabaseAdminClient();
  await adminSupabase.from("profiles").delete().eq("email", normalizedEmail);
}
