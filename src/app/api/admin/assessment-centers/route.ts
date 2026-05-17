import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type CreateAssessmentCenterPayload = {
  address?: string;
  contact?: string;
  email?: string;
  manager?: string;
  name?: string;
  password?: string;
};

type DeleteAssessmentCenterPayload = {
  id?: string;
};

async function syncAssessmentCenterProfile(email: string, authUserId: string) {
  const adminSupabase = createSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: existingProfile, error: lookupError } = await adminSupabase
    .from("profiles")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    return "Unable to verify the `profiles` table for assessment center role sync.";
  }

  if (existingProfile) {
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({ role: "assessment_center" })
      .eq("email", normalizedEmail);

    if (updateError) {
      return "Unable to update the `profiles` table with the assessment center role.";
    }

    return null;
  }

  const { error: insertError } = await adminSupabase
    .from("profiles")
    .insert({
      id: authUserId,
      email: normalizedEmail,
      role: "assessment_center",
    });

  if (insertError) {
    return "Unable to insert the assessment center into the `profiles` table. Check whether `profiles` allows inserts with just `email` and `role`.";
  }

  return null;
}

async function deleteAssessmentCenterProfile(email: string) {
  const adminSupabase = createSupabaseAdminClient();
  await adminSupabase
    .from("profiles")
    .delete()
    .eq("email", email.trim().toLowerCase())
    .eq("role", "assessment_center");
}

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("assessment_centers")
    .select("id, name, address, manager, contact, center_email, center_auth_user_id, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load assessment centers. Make sure the `assessment_centers` table and its RLS policies are created in Supabase.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, centers: data ?? [] });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateAssessmentCenterPayload;
  const name = body.name?.trim() ?? "";
  const address = body.address?.trim() ?? "";
  const manager = body.manager?.trim() ?? "";
  const contact = body.contact?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!name || !address || !manager || !contact || !email || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Center name, address, center head, contact, email, and password are required.",
      },
      { status: 400 },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json({ success: false, message: "A valid login email is required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 8 characters long." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  let assessmentCenterAuthUserId: string | null = null;
  let profileSyncWarning: string | null = null;

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data: authUserData, error: authUserError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
      user_metadata: {
        role: "assessment_center",
      },
    });

    if (authUserError || !authUserData.user?.id) {
      return NextResponse.json(
        {
          success: false,
          message: authUserError?.message ?? "Unable to create assessment center login account.",
        },
        { status: 500 },
      );
    }

    assessmentCenterAuthUserId = authUserData.user.id;
    profileSyncWarning = await syncAssessmentCenterProfile(email, assessmentCenterAuthUserId);
  } catch (error) {
    if (assessmentCenterAuthUserId) {
      try {
        const adminSupabase = createSupabaseAdminClient();
        await adminSupabase.auth.admin.deleteUser(assessmentCenterAuthUserId);
      } catch {
        // Best-effort rollback only.
      }
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Unable to initialize Supabase admin access for account creation.",
      },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from("assessment_centers")
    .insert({
      address,
      center_auth_user_id: assessmentCenterAuthUserId,
      center_email: email,
      contact,
      created_by: currentUser.id,
      created_by_email: currentUser.email,
      manager,
      name,
    })
    .select("id, name, address, manager, contact, created_at")
    .single();

  if (error) {
    if (assessmentCenterAuthUserId) {
      try {
        const adminSupabase = createSupabaseAdminClient();
        await adminSupabase.auth.admin.deleteUser(assessmentCenterAuthUserId);
      } catch {
        // Best-effort rollback only.
      }
    }

    await deleteAssessmentCenterProfile(email);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to create assessment center. Make sure the `assessment_centers` table exists, includes the login columns, and your Supabase RLS policies allow admins to insert records.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    center: data,
    message: profileSyncWarning
      ? `Assessment center created successfully. ${profileSyncWarning}`
      : "Assessment center created successfully.",
  });
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as DeleteAssessmentCenterPayload;
  const centerId = body.id?.trim() ?? "";

  if (!centerId) {
    return NextResponse.json({ success: false, message: "Assessment center ID is required." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingCenter, error: lookupError } = await supabase
    .from("assessment_centers")
    .select("id, center_email, center_auth_user_id")
    .eq("id", centerId)
    .maybeSingle();

  if (lookupError || !existingCenter) {
    return NextResponse.json({ success: false, message: "Assessment center not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("assessment_centers").delete().eq("id", centerId);

  if (deleteError) {
    return NextResponse.json(
      { success: false, message: "Unable to delete the assessment center record." },
      { status: 500 },
    );
  }

  if (existingCenter.center_auth_user_id) {
    try {
      const adminSupabase = createSupabaseAdminClient();
      await adminSupabase.auth.admin.deleteUser(existingCenter.center_auth_user_id);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Assessment center record was removed, but the linked Auth user could not be deleted automatically. Please remove it manually in Supabase Authentication.",
        },
        { status: 500 },
      );
    }
  }

  if (existingCenter.center_email) {
    await deleteAssessmentCenterProfile(existingCenter.center_email);
  }

  return NextResponse.json({ success: true, message: "Assessment center deleted successfully." });
}
