import { NextResponse } from "next/server";
import {
  getAssessmentCenterLinkMessage,
  resolveAssessmentCenterForUser,
  type AssessmentCenterLinkStatus,
} from "@/lib/assessment-centers";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition } from "@/lib/workflow-history";

type UpdateAssessmentCenterSubmissionPayload = {
  action?: "move_to_result_encoding" | "pass" | "not_pass" | "coc";
  reason?: string | null;
  submissionId?: string;
};

type ResolvedCenterRecord = {
  center_auth_user_id: string | null;
  center_email: string | null;
  id: string;
  name: string;
};

async function resolveCurrentCenter(currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>) {
  return resolveAssessmentCenterForUser<ResolvedCenterRecord>(
    currentUser,
    "id, name, center_email, center_auth_user_id",
  );
}

function buildCenterLinkFailureResponse(status: AssessmentCenterLinkStatus) {
  const message = getAssessmentCenterLinkMessage(status);

  if (status === "email_conflict") {
    return NextResponse.json({ success: false, message }, { status: 403 });
  }

  return NextResponse.json({ success: false, message }, { status: 404 });
}

export async function GET() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "assessment_center") {
    return NextResponse.json({ success: false, message: "Assessment center access is required." }, { status: 403 });
  }

  const adminSupabase = createSupabaseAdminClient();
  let centerResult;

  try {
    centerResult = await resolveCurrentCenter(currentUser);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to verify the assessment center record linked to this account.",
      },
      { status: 500 },
    );
  }

  if (!centerResult.center) {
    return buildCenterLinkFailureResponse(centerResult.status);
  }

  const center = centerResult.center;

  const { data, error } = await adminSupabase
    .from("assessment_center_applicants")
    .select(
      "id, applicant_name, applicant_reference, qualification, assignment_batch, assignment_group_key, assignment_group_number, assignment_title, assessment_date, assessor, assigned_at, schedule_updated_at",
    )
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

  const submissionIds = (data ?? []).map((applicant) => applicant.applicant_reference);
  const { data: submissions, error: submissionsError } = submissionIds.length
    ? await adminSupabase
        .from("applicant_application_submissions")
        .select("id, workflow_status, latest_status_reason")
        .in("id", submissionIds)
    : { data: [], error: null };

  if (submissionsError) {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load linked submission statuses for assigned applicants.",
      },
      { status: 500 },
    );
  }

  const submissionById = new Map((submissions ?? []).map((submission) => [submission.id, submission]));

  return NextResponse.json({
    success: true,
    applicants: (data ?? []).map((applicant) => ({
      ...applicant,
      latest_status_reason: submissionById.get(applicant.applicant_reference)?.latest_status_reason ?? null,
      workflow_status: (submissionById.get(applicant.applicant_reference)?.workflow_status ?? "assigned") as ApplicationSubmissionStatus,
    })),
    centerName: center.name,
    centerLinkNotice: getAssessmentCenterLinkMessage(centerResult.status),
  });
}

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "assessment_center") {
    return NextResponse.json({ success: false, message: "Assessment center access is required." }, { status: 403 });
  }

  const body = (await request.json()) as UpdateAssessmentCenterSubmissionPayload;
  const submissionId = body.submissionId?.trim() ?? "";
  const reason = body.reason?.trim() ?? "";
  const action = body.action;

  if (!submissionId || !action) {
    return NextResponse.json(
      { success: false, message: "A submission and processing action are required." },
      { status: 400 },
    );
  }

  let centerResult;

  try {
    centerResult = await resolveCurrentCenter(currentUser);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unable to verify the assessment center record linked to this account.",
      },
      { status: 500 },
    );
  }

  if (!centerResult.center) {
    return buildCenterLinkFailureResponse(centerResult.status);
  }

  const center = centerResult.center;
  const adminSupabase = createSupabaseAdminClient();
  const { data: assignment, error: assignmentError } = await adminSupabase
    .from("assessment_center_applicants")
    .select("id")
    .eq("assessment_center_id", center.id)
    .eq("applicant_reference", submissionId)
    .maybeSingle();

  if (assignmentError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify the assigned submission for this center." },
      { status: 500 },
    );
  }

  if (!assignment) {
    return NextResponse.json(
      { success: false, message: "This submission is not assigned to your center." },
      { status: 403 },
    );
  }

  const { data: submission, error: submissionError } = await adminSupabase
    .from("applicant_application_submissions")
    .select("id, applicant_id, applicant_email, applicant_name, qualification_title, workflow_status")
    .eq("id", submissionId)
    .maybeSingle();

  if (submissionError || !submission) {
    return NextResponse.json(
      { success: false, message: "Unable to load the submission record for processing." },
      { status: submissionError ? 500 : 404 },
    );
  }

  const currentStatus = submission.workflow_status as ApplicationSubmissionStatus;
  const normalizedReason = reason || null;
  let nextStatus: ApplicationSubmissionStatus;
  let eventType: string;
  let notificationTitle: string;
  let notificationMessage: string;
  let responseMessage: string;

  if (action === "move_to_result_encoding") {
    if (currentStatus !== "assigned" && currentStatus !== "under_review") {
      return NextResponse.json(
        { success: false, message: "Only assigned or under-review submissions can be moved to result encoding." },
        { status: 400 },
      );
    }

    nextStatus = "for_result_encoding";
    eventType = "assessment_center_sent_for_result_encoding";
    notificationTitle = "Ready for Result Encoding";
    notificationMessage = `${center.name} finished reviewing your ${submission.qualification_title} application and moved it to result encoding.`;
    responseMessage = "Submission moved to result encoding.";
  } else if (action === "pass") {
    if (currentStatus !== "for_result_encoding") {
      return NextResponse.json(
        { success: false, message: "Only submissions in result encoding can be marked as competent." },
        { status: 400 },
      );
    }

    nextStatus = "passed";
    eventType = "assessment_center_passed";
    notificationTitle = "Application Competent";
    notificationMessage = `${center.name} marked your ${submission.qualification_title} application as competent.`;
    responseMessage = "Submission marked as competent.";
  } else if (action === "not_pass") {
    if (currentStatus !== "for_result_encoding") {
      return NextResponse.json(
        { success: false, message: "Only submissions in result encoding can be marked as not competent." },
        { status: 400 },
      );
    }

    nextStatus = "not_passed";
    eventType = "assessment_center_not_passed";
    notificationTitle = "Application Not Competent";
    notificationMessage = `${center.name} marked your ${submission.qualification_title} application as not competent.`;
    responseMessage = "Submission marked as not competent.";
  } else if (action === "coc") {
    if (currentStatus !== "for_result_encoding") {
      return NextResponse.json(
        { success: false, message: "Only submissions in result encoding can be marked as COC." },
        { status: 400 },
      );
    }

    nextStatus = "completed";
    eventType = "assessment_center_completed";
    notificationTitle = "Application COC";
    notificationMessage = `${center.name} marked your ${submission.qualification_title} application as COC.`;
    responseMessage = "Submission marked as COC.";
  } else {
    return NextResponse.json({ success: false, message: "Unsupported assessment-center action." }, { status: 400 });
  }

  const processedAt = new Date().toISOString();
  const { error: updateError } = await adminSupabase
    .from("applicant_application_submissions")
    .update({
      latest_status_reason: normalizedReason,
      latest_status_updated_at: processedAt,
      updated_at: processedAt,
      workflow_status: nextStatus,
    })
    .eq("id", submissionId);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Unable to update the submission status right now." },
      { status: 500 },
    );
  }

  try {
    await recordSubmissionWorkflowTransition({
      actor: currentUser,
      eventType,
      fromStatus: currentStatus,
      metadata: {
        assessmentCenterId: center.id,
        assessmentCenterName: center.name,
      },
      notifications: [
        {
          message: notificationMessage,
          notificationType: nextStatus === "passed" ? "success" : nextStatus === "not_passed" ? "warning" : "info",
          recipientEmail: submission.applicant_email,
          recipientRole: "applicant",
          recipientUserId: submission.applicant_id,
          submissionId: submission.id,
          title: notificationTitle,
        },
      ],
      reason: normalizedReason,
      submissionId: submission.id,
      toStatus: nextStatus,
    });
  } catch (historyError) {
    console.error("Failed to record assessment center workflow history.", {
      centerId: center.id,
      error: historyError,
      submissionId,
    });
  }

  return NextResponse.json({
    success: true,
    message: responseMessage,
    reason: normalizedReason,
    workflowStatus: nextStatus,
  });
}
