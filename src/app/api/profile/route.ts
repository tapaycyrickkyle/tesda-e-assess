import { NextResponse } from "next/server";
import { resolveAssessmentCenterForUser } from "@/lib/assessment-centers";
import { getCurrentAppUser } from "@/lib/current-user";
import {
  buildFullName,
  isValidPhilippineMobileNumberInput,
  normalizeContactNumber,
  normalizeOptionalText,
} from "@/lib/registration";
import { createSupabaseAdminClient } from "@/lib/supabase";

type UpdateProfilePayload = {
  address?: string;
  contact?: string;
  contactNumber?: string;
  firstName?: string;
  institutionName?: string;
  institutionType?: string;
  lastName?: string;
  manager?: string;
  middleName?: string;
  nameExtension?: string;
  name?: string;
  positionTitle?: string;
};

async function upsertOwnProfileRecord({
  contactNumber,
  currentUserId,
  email,
  firstName,
  institutionName,
  institutionType,
  lastName,
  middleName,
  nameExtension,
  positionTitle,
  role,
}: {
  contactNumber: string | null;
  currentUserId: string;
  email: string;
  firstName: string;
  institutionName: string | null;
  institutionType: string | null;
  lastName: string;
  middleName: string | null;
  nameExtension: string | null;
  positionTitle: string | null;
  role: "admin" | "applicant" | "teacher";
}) {
  const supabase = createSupabaseAdminClient();
  const fullName = buildFullName({
    firstName,
    lastName,
    middleName,
    nameExtension,
  });

  const payload = {
    contact_number: contactNumber,
    email,
    first_name: firstName,
    full_name: fullName,
    id: currentUserId,
    institution_name: institutionName,
    institution_type: institutionType,
    last_name: lastName,
    middle_name: middleName,
    name_extension: nameExtension,
    position_title: positionTitle,
    role,
  };

  const { error } = await supabase.from("profiles").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    throw new Error("Unable to update your profile details right now.");
  }
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  const body = (await request.json()) as UpdateProfilePayload;

  if (currentUser.role === "assessment_center") {
    const name = body.name?.trim() ?? "";
    const manager = body.manager?.trim() ?? "";
    const contact = body.contact?.trim() ?? "";
    const address = body.address?.trim() ?? "";

    if (!name || !manager || !contact || !address) {
      return NextResponse.json(
        {
          success: false,
          message: "Center name, manager, contact, and address are required.",
        },
        { status: 400 },
      );
    }

    let centerResult;

    try {
      centerResult = await resolveAssessmentCenterForUser(currentUser, "id, center_auth_user_id, center_email");
    } catch {
      return NextResponse.json(
        { success: false, message: "Unable to verify the assessment center record linked to this account." },
        { status: 500 },
      );
    }

    if (!centerResult.center) {
      return NextResponse.json(
        { success: false, message: "No assessment center record is linked to this account yet." },
        { status: 404 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("assessment_centers")
      .update({
        address,
        contact,
        manager,
        name,
      })
      .eq("id", centerResult.center.id);

    if (error) {
      return NextResponse.json(
        { success: false, message: "Unable to update the assessment center details right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Assessment center profile updated successfully.",
    });
  }

  if (currentUser.role !== "admin" && currentUser.role !== "applicant" && currentUser.role !== "teacher") {
    return NextResponse.json({ success: false, message: "This account cannot update a profile here." }, { status: 403 });
  }

  const firstName = body.firstName?.trim() ?? "";
  const middleName = normalizeOptionalText(body.middleName);
  const nameExtension = normalizeOptionalText(body.nameExtension);
  const lastName = body.lastName?.trim() ?? "";
  const rawContactNumber = body.contactNumber?.trim() ?? "";
  const institutionName = normalizeOptionalText(body.institutionName);
  const institutionType = normalizeOptionalText(body.institutionType)?.toLowerCase() ?? null;
  const positionTitle = normalizeOptionalText(body.positionTitle);

  if (!firstName || !lastName) {
    return NextResponse.json(
      { success: false, message: "First name and last name are required." },
      { status: 400 },
    );
  }

  if (rawContactNumber && !isValidPhilippineMobileNumberInput(rawContactNumber)) {
    return NextResponse.json(
      {
        success: false,
        message: "Enter a valid Philippine mobile number. Use 09123456789 or 9123456789.",
      },
      { status: 400 },
    );
  }

  if (currentUser.role === "teacher" && institutionType && institutionType !== "public" && institutionType !== "private") {
    return NextResponse.json(
      {
        success: false,
        message: "Institution type must be either public or private.",
      },
      { status: 400 },
    );
  }

  try {
    await upsertOwnProfileRecord({
      contactNumber: rawContactNumber ? normalizeContactNumber(rawContactNumber) : null,
      currentUserId: currentUser.id,
      email: currentUser.email.trim().toLowerCase(),
      firstName,
      institutionName: currentUser.role === "teacher" ? institutionName : null,
      institutionType: currentUser.role === "teacher" ? institutionType : null,
      lastName,
      middleName,
      nameExtension,
      positionTitle: currentUser.role === "teacher" ? positionTitle : null,
      role: currentUser.role,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to update your profile details right now.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Profile updated successfully.",
  });
}
