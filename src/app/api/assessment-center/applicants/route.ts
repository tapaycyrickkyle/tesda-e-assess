import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient, createSupabaseAdminClient } from "@/lib/supabase";

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "assessment_center") {
    return NextResponse.json({ success: false, message: "Assessment center access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
  const adminSupabase = createSupabaseAdminClient();
  const { data: centerByAuthId, error: centerByAuthIdError } = await adminSupabase
    .from("assessment_centers")
    .select("id, name, center_email, center_auth_user_id")
    .eq("center_auth_user_id", currentUser.id)
    .maybeSingle();

  if (centerByAuthIdError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify the assessment center record linked to this account.",
      },
      { status: 500 },
    );
  }

  let center = centerByAuthId;

  if (!center) {
    const { data: centerByEmail, error: centerByEmailError } = await adminSupabase
      .from("assessment_centers")
      .select("id, name, center_email, center_auth_user_id")
      .eq("center_email", currentUser.email.toLowerCase())
      .maybeSingle();

    if (centerByEmailError) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to verify the assessment center record using the account email fallback.",
        },
        { status: 500 },
      );
    }

    center = centerByEmail;

    if (center && center.center_auth_user_id !== currentUser.id) {
      await adminSupabase
        .from("assessment_centers")
        .update({ center_auth_user_id: currentUser.id })
        .eq("id", center.id);
    }
  }

  if (!center) {
    return NextResponse.json(
      {
        success: false,
        message:
          "No assessment center record is linked to this account. Make sure the assessment center row has either the correct center_auth_user_id or matching center_email.",
      },
      { status: 404 },
    );
  }

  const { data, error } = await supabase
    .from("assessment_center_applicants")
    .select("id, applicant_name, applicant_reference, qualification, assignment_batch, assigned_at")
    .eq("assessment_center_id", center.id)
    .order("assigned_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load assigned applicants. Make sure the `assessment_center_applicants` table exists and its policies allow assessment center access.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    applicants: data ?? [],
    centerName: center.name,
  });
}
