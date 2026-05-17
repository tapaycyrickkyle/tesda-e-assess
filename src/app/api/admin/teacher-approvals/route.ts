import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type TeacherApprovalAction = "approve" | "reject";

type TeacherApprovalRequestRecord = {
  approval_status: "approved" | "pending_review" | "rejected";
  auth_user_id: string;
  contact_number: string;
  created_at: string;
  email: string;
  first_name: string;
  full_name: string;
  id: string;
  institution_name: string;
  institution_type: "private" | "public";
  last_name: string;
  middle_name: string | null;
  position_title: string;
  verification_document_mime_type: string | null;
  verification_document_name: string;
  verification_document_path: string;
};

type UpdateTeacherApprovalPayload = {
  action?: TeacherApprovalAction;
  requestId?: string;
};

async function createVerificationDocumentUrl(path: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data, error } = await adminSupabase.storage
    .from("teacher-verification-docs")
    .createSignedUrl(path, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
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
    .from("teacher_registration_requests")
    .select(
      "id, auth_user_id, email, first_name, middle_name, last_name, full_name, contact_number, institution_name, institution_type, position_title, verification_document_name, verification_document_path, verification_document_mime_type, approval_status, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load teacher approval requests. Confirm the `teacher_registration_requests` table exists and admins can select it.",
      },
      { status: 500 },
    );
  }

  const normalizedRequests = await Promise.all(
    ((data ?? []) as TeacherApprovalRequestRecord[]).map(async (requestRecord) => ({
      ...requestRecord,
      verification_document_url: await createVerificationDocumentUrl(requestRecord.verification_document_path),
    })),
  );

  return NextResponse.json({ success: true, requests: normalizedRequests });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as UpdateTeacherApprovalPayload;
  const requestId = body.requestId?.trim() ?? "";
  const action = body.action;

  if (!requestId || (action !== "approve" && action !== "reject")) {
    return NextResponse.json(
      { success: false, message: "Teacher request ID and a valid approval action are required." },
      { status: 400 },
    );
  }

  const nextApprovalStatus = action === "approve" ? "approved" : "rejected";
  const supabase = createSupabaseAdminClient();
  const { data: existingRequest, error: lookupError } = await supabase
    .from("teacher_registration_requests")
    .select("id, auth_user_id, email")
    .eq("id", requestId)
    .maybeSingle();

  if (lookupError || !existingRequest) {
    return NextResponse.json({ success: false, message: "Teacher approval request was not found." }, { status: 404 });
  }

  const { data: updatedRequest, error: updateRequestError } = await supabase
    .from("teacher_registration_requests")
    .update({ approval_status: nextApprovalStatus })
    .eq("id", requestId)
    .select(
      "id, auth_user_id, email, first_name, middle_name, last_name, full_name, contact_number, institution_name, institution_type, position_title, verification_document_name, verification_document_path, verification_document_mime_type, approval_status, created_at",
    )
    .single();

  if (updateRequestError) {
    return NextResponse.json(
      { success: false, message: "Unable to update the teacher approval request." },
      { status: 500 },
    );
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ approval_status: nextApprovalStatus, role: "teacher" })
    .eq("email", existingRequest.email.toLowerCase());

  if (updateProfileError) {
    return NextResponse.json(
      { success: false, message: "Teacher request was updated, but the matching profile could not be synchronized." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: action === "approve" ? "Teacher account approved successfully." : "Teacher account rejected successfully.",
    request: {
      ...(updatedRequest as TeacherApprovalRequestRecord),
      verification_document_url: await createVerificationDocumentUrl(
        (updatedRequest as TeacherApprovalRequestRecord).verification_document_path,
      ),
    },
  });
}
