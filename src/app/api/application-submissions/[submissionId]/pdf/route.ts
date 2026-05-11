import { NextResponse } from "next/server";
import { generateApplicationPdf } from "@/lib/application-pdf";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient, createSupabaseAdminClient } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

type SubmissionRecord = {
  applicant_email: string;
  form_data: unknown;
  id: string;
  room_id: string | null;
  submission_source: "individual" | "room";
  workflow_status: "submitted_to_teacher" | "submitted_to_admin";
};

async function resolveAssessmentCenterId(userId: string, email: string) {
  const adminSupabase = createSupabaseAdminClient();
  const { data: centerByAuthId, error: centerByAuthIdError } = await adminSupabase
    .from("assessment_centers")
    .select("id, center_auth_user_id, center_email")
    .eq("center_auth_user_id", userId)
    .maybeSingle();

  if (centerByAuthIdError) {
    throw new Error("Unable to verify the assessment center account linked to this user.");
  }

  if (centerByAuthId) {
    return centerByAuthId.id;
  }

  const { data: centerByEmail, error: centerByEmailError } = await adminSupabase
    .from("assessment_centers")
    .select("id, center_auth_user_id")
    .eq("center_email", email.toLowerCase())
    .maybeSingle();

  if (centerByEmailError) {
    throw new Error("Unable to verify the assessment center account using the email fallback.");
  }

  if (!centerByEmail) {
    return null;
  }

  if (centerByEmail.center_auth_user_id !== userId) {
    await adminSupabase.from("assessment_centers").update({ center_auth_user_id: userId }).eq("id", centerByEmail.id);
  }

  return centerByEmail.id;
}

async function getSubmissionForCurrentUser(submissionId: string) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return { error: "You must be logged in.", status: 401 as const };
  }

  const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);

  if (currentUser.role === "student") {
    const { data, error } = await supabase
      .from("applicant_application_submissions")
      .select("id, applicant_email, form_data, room_id, submission_source, workflow_status")
      .eq("id", submissionId)
      .eq("applicant_id", currentUser.id)
      .maybeSingle();

    if (error) {
      return { error: "Unable to load the submitted application form.", status: 500 as const };
    }

    return { currentUser, submission: (data as SubmissionRecord | null) ?? null, status: 200 as const };
  }

  if (currentUser.role === "teacher") {
    const { data, error } = await supabase
      .from("applicant_application_submissions")
      .select("id, applicant_email, form_data, room_id, submission_source, workflow_status, rooms!inner(teacher_id)")
      .eq("id", submissionId)
      .eq("rooms.teacher_id", currentUser.id)
      .maybeSingle();

    if (error) {
      return { error: "Unable to load the room application form.", status: 500 as const };
    }

    if (!data) {
      return { currentUser, submission: null, status: 200 as const };
    }

    const submission = {
      applicant_email: data.applicant_email,
      form_data: data.form_data,
      id: data.id,
      room_id: data.room_id,
      submission_source: data.submission_source,
      workflow_status: data.workflow_status,
    } satisfies SubmissionRecord;

    return { currentUser, submission, status: 200 as const };
  }

  if (currentUser.role === "admin") {
    const { data, error } = await supabase
      .from("applicant_application_submissions")
      .select("id, applicant_email, form_data, room_id, submission_source, workflow_status")
      .eq("id", submissionId)
      .maybeSingle();

    if (error) {
      return { error: "Unable to load the submitted application form.", status: 500 as const };
    }

    return { currentUser, submission: (data as SubmissionRecord | null) ?? null, status: 200 as const };
  }

  if (currentUser.role === "assessment_center") {
    const centerId = await resolveAssessmentCenterId(currentUser.id, currentUser.email);

    if (!centerId) {
      return { error: "No assessment center account is linked to this user.", status: 404 as const };
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("assessment_center_applicants")
      .select("id")
      .eq("assessment_center_id", centerId)
      .eq("applicant_reference", submissionId)
      .maybeSingle();

    if (assignmentError) {
      return { error: "Unable to verify the assigned application form.", status: 500 as const };
    }

    if (!assignment) {
      return { error: "This application form is not assigned to your center.", status: 403 as const };
    }

    const adminSupabase = createSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("applicant_application_submissions")
      .select("id, applicant_email, form_data, room_id, submission_source, workflow_status")
      .eq("id", submissionId)
      .maybeSingle();

    if (error) {
      return { error: "Unable to load the assigned application form.", status: 500 as const };
    }

    return { currentUser, submission: (data as SubmissionRecord | null) ?? null, status: 200 as const };
  }

  return { error: "Your account is not allowed to access application PDFs.", status: 403 as const };
}

async function getRoomName(roomId: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("rooms").select("name").eq("id", roomId).maybeSingle();
  return data?.name ?? null;
}

export async function GET(request: Request, context: RouteContext) {
  const { submissionId } = await context.params;
  const lookup = await getSubmissionForCurrentUser(submissionId);

  if ("error" in lookup) {
    return NextResponse.json({ success: false, message: lookup.error }, { status: lookup.status });
  }

  if (!lookup.submission) {
    return NextResponse.json({ success: false, message: "Application form not found." }, { status: 404 });
  }

  const roomName = lookup.submission.room_id ? await getRoomName(lookup.submission.room_id) : null;
  const { fileName, pdfBytes } = await generateApplicationPdf(lookup.submission.form_data, {
    applicantEmail: lookup.submission.applicant_email,
    roomName,
    submissionSource: lookup.submission.submission_source,
    workflowStatus: lookup.submission.workflow_status,
  });

  const download = new URL(request.url).searchParams.get("download") === "1";

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename=\"${fileName}\"`,
      "Content-Type": "application/pdf",
    },
  });
}
