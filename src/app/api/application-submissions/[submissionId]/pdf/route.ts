import { NextResponse } from "next/server";
import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
} from "@/lib/assessment-centers";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { generateApplicationPdf, generateSagPdf } from "@/lib/application-pdf";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

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
  workflow_status: ApplicationSubmissionStatus;
};

async function resolveAssessmentCenterId(currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>) {
  const centerResult = await resolveAssessmentCenterForUser<{
    center_auth_user_id: string | null;
    center_email: string | null;
    id: string;
  }>(currentUser, "id, center_auth_user_id, center_email");

  if (!centerResult.center) {
    return {
      centerId: null,
      message: getAssessmentCenterLinkMessage(centerResult.status),
      status: centerResult.status === "email_conflict" ? 403 : 404,
    };
  }

  return {
    centerId: centerResult.center.id,
    message: null,
    status: 200,
  };
}

async function getSubmissionForCurrentUser(submissionId: string) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return { error: "You must be logged in.", status: 401 as const };
  }

  const supabase = createSupabaseAdminClient();

  if (currentUser.role === "applicant") {
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
      .select("id, applicant_email, form_data, room_id, submission_source, workflow_status")
      .eq("id", submissionId)
      .maybeSingle();

    if (error) {
      return { error: "Unable to load the room application form.", status: 500 as const };
    }

    if (!data || !data.room_id) {
      return { currentUser, submission: null, status: 200 as const };
    }

    const { data: ownedRoom, error: ownedRoomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", data.room_id)
      .eq("teacher_id", currentUser.id)
      .maybeSingle();

    if (ownedRoomError) {
      return { error: "Unable to verify the room application form.", status: 500 as const };
    }

    if (!ownedRoom) {
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
    const centerResolution = await resolveAssessmentCenterId(currentUser);

    if (!centerResolution.centerId) {
      return {
        error: centerResolution.message ?? "No assessment center account is linked to this user.",
        status: centerResolution.status as 403 | 404,
      };
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from("assessment_center_applicants")
      .select("id")
      .eq("assessment_center_id", centerResolution.centerId)
      .eq("applicant_reference", submissionId)
      .maybeSingle();

    if (assignmentError) {
      return { error: "Unable to verify the assigned application form.", status: 500 as const };
    }

    if (!assignment) {
      return { error: "This application form is not assigned to your center.", status: 403 as const };
    }

    const { data, error } = await supabase
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
  const document = new URL(request.url).searchParams.get("document") === "sag" ? "sag" : "application";
  const generator = document === "sag" ? generateSagPdf : generateApplicationPdf;
  let generatedPdf: Awaited<ReturnType<typeof generateApplicationPdf>>;

  try {
    generatedPdf = await generator(lookup.submission.form_data, {
      applicantEmail: lookup.submission.applicant_email,
      roomName,
      submissionSource: lookup.submission.submission_source,
      workflowStatus: lookup.submission.workflow_status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : `Unable to generate the ${document === "sag" ? "SAG" : "application"} PDF.`,
      },
      { status: 500 },
    );
  }

  const download = new URL(request.url).searchParams.get("download") === "1";

  return new NextResponse(Buffer.from(generatedPdf.pdfBytes), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename=\"${generatedPdf.fileName}\"`,
      "Content-Type": "application/pdf",
    },
  });
}
