import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
} from "@/lib/assessment-centers";
import type { CurrentAppUser } from "@/lib/current-user";
import { formatPhilippineMobileNumberForLocalDisplay } from "@/lib/registration";
import { createSupabaseAdminClient } from "@/lib/supabase";

type ProfileRecord = {
  approval_status?: string | null;
  contact_number?: string | null;
  created_at?: string | null;
  email?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  id?: string;
  institution_name?: string | null;
  institution_type?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  position_title?: string | null;
  role?: string | null;
  updated_at?: string | null;
};

type AssessmentCenterRecord = {
  address?: string | null;
  center_email?: string | null;
  contact?: string | null;
  created_at?: string | null;
  manager?: string | null;
  name?: string | null;
};

export type UserProfileField = {
  label: string;
  value: string;
};

export type UserProfileSection = {
  fields: UserProfileField[];
  title: string;
};

export type UserProfileView = {
  displayName: string;
  editor: {
    assessmentCenter: {
      address: string;
      contact: string;
      manager: string;
      name: string;
    } | null;
    profile: {
      contactNumber: string;
      firstName: string;
      institutionName: string;
      institutionType: string;
      lastName: string;
      middleName: string;
      positionTitle: string;
    };
    role: CurrentAppUser["role"];
  };
  notice: string;
  sections: UserProfileSection[];
};

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function formatRoleLabel(role: CurrentAppUser["role"]) {
  if (role === "assessment_center") {
    return "Assessment Center";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatStatus(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "Active";
  }

  return normalized
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatInstitutionType(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDateTime(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(normalized));
}

async function loadProfileRecord(currentUser: CurrentAppUser) {
  const supabase = createSupabaseAdminClient();
  const selectFields =
    "id, email, role, full_name, first_name, middle_name, last_name, contact_number, institution_name, institution_type, position_title, approval_status, created_at, updated_at";

  const { data: profileById, error: profileByIdError } = await supabase
    .from("profiles")
    .select(selectFields)
    .eq("id", currentUser.id)
    .maybeSingle();

  if (profileByIdError) {
    return { error: true, profile: null as ProfileRecord | null };
  }

  if (profileById) {
    return { error: false, profile: profileById as ProfileRecord };
  }

  const { data: profileByEmail, error: profileByEmailError } = await supabase
    .from("profiles")
    .select(selectFields)
    .eq("email", currentUser.email.toLowerCase())
    .maybeSingle();

  if (profileByEmailError) {
    return { error: true, profile: null as ProfileRecord | null };
  }

  return { error: false, profile: (profileByEmail as ProfileRecord | null) ?? null };
}

async function loadAssessmentCenterRecord(currentUser: CurrentAppUser) {
  if (currentUser.role !== "assessment_center") {
    return { error: false, notice: "", record: null as AssessmentCenterRecord | null };
  }

  try {
    const result = await resolveAssessmentCenterForUser<
      AssessmentCenterRecord & { center_auth_user_id?: string | null; id: string }
    >(currentUser, "id, name, manager, contact, address, center_email, created_at, center_auth_user_id");

    return {
      error: false,
      notice: getAssessmentCenterLinkMessage(result.status) ?? "",
      record: result.center,
    };
  } catch {
    return { error: true, notice: "", record: null as AssessmentCenterRecord | null };
  }
}

export async function loadUserProfileView(currentUser: CurrentAppUser): Promise<UserProfileView> {
  const [
    { error: profileError, profile },
    { error: centerError, notice: centerNotice, record: centerRecord },
  ] = await Promise.all([
    loadProfileRecord(currentUser),
    loadAssessmentCenterRecord(currentUser),
  ]);

  const roleLabel = formatRoleLabel(currentUser.role);
  const profileDisplayName =
    normalizeText(profile?.full_name) ??
    normalizeText(centerRecord?.name) ??
    normalizeText(profile?.first_name) ??
    currentUser.email;

  const personalFields: UserProfileField[] = [
    { label: "Full Name", value: normalizeText(profile?.full_name) ?? "Not provided" },
    { label: "First Name", value: normalizeText(profile?.first_name) ?? "Not provided" },
    { label: "Middle Name", value: normalizeText(profile?.middle_name) ?? "Not provided" },
    { label: "Last Name", value: normalizeText(profile?.last_name) ?? "Not provided" },
    { label: "Contact Number", value: formatPhilippineMobileNumberForLocalDisplay(profile?.contact_number) || "Not provided" },
  ];

  const sections: UserProfileSection[] = [
    {
      title: "Account Details",
      fields: [
        { label: "Role", value: roleLabel },
        { label: "Email", value: currentUser.email },
        { label: "Account Status", value: formatStatus(profile?.approval_status) },
        { label: "Profile Created", value: formatDateTime(profile?.created_at) ?? "Not available" },
        { label: "Last Updated", value: formatDateTime(profile?.updated_at) ?? "Not available" },
      ],
    },
  ];

  if (currentUser.role !== "assessment_center") {
    sections.push({
      title: "Personal Information",
      fields: personalFields,
    });
  }

  if (
    normalizeText(profile?.institution_name) ||
    normalizeText(profile?.institution_type) ||
    normalizeText(profile?.position_title)
  ) {
    sections.push({
      title: "Institution Details",
      fields: [
        { label: "Institution Name", value: normalizeText(profile?.institution_name) ?? "Not provided" },
        { label: "Institution Type", value: formatInstitutionType(profile?.institution_type) ?? "Not provided" },
        { label: "Position Title", value: normalizeText(profile?.position_title) ?? "Not provided" },
      ],
    });
  }

  if (centerRecord) {
    sections.push({
      title: "Assessment Center Details",
      fields: [
        { label: "Center Name", value: normalizeText(centerRecord.name) ?? "Not provided" },
        { label: "Center Email", value: normalizeText(centerRecord.center_email) ?? currentUser.email },
        { label: "Manager", value: normalizeText(centerRecord.manager) ?? "Not provided" },
        { label: "Contact", value: normalizeText(centerRecord.contact) ?? "Not provided" },
        { label: "Address", value: normalizeText(centerRecord.address) ?? "Not provided" },
        { label: "Center Record Created", value: formatDateTime(centerRecord.created_at) ?? "Not available" },
      ],
    });
  }

  let notice = "";

  if (profileError || centerError) {
    notice = "Some profile details could not be loaded right now. Basic account information is still available below.";
  } else if (centerNotice) {
    notice = centerNotice;
  } else if (!profile && currentUser.role !== "assessment_center") {
    notice = "Your account is active, but some profile fields have not been filled in yet.";
  } else if (!profile && currentUser.role === "assessment_center" && !centerRecord) {
    notice = "No linked profile details were found for this assessment center account yet.";
  }

  return {
    displayName: profileDisplayName,
    editor: {
      assessmentCenter: centerRecord
        ? {
            address: normalizeText(centerRecord.address) ?? "",
            contact: normalizeText(centerRecord.contact) ?? "",
            manager: normalizeText(centerRecord.manager) ?? "",
            name: normalizeText(centerRecord.name) ?? "",
          }
        : null,
      profile: {
        contactNumber: formatPhilippineMobileNumberForLocalDisplay(profile?.contact_number),
        firstName: normalizeText(profile?.first_name) ?? "",
        institutionName: normalizeText(profile?.institution_name) ?? "",
        institutionType: normalizeText(profile?.institution_type) ?? "",
        lastName: normalizeText(profile?.last_name) ?? "",
        middleName: normalizeText(profile?.middle_name) ?? "",
        positionTitle: normalizeText(profile?.position_title) ?? "",
      },
      role: currentUser.role,
    },
    notice,
    sections,
  };
}
