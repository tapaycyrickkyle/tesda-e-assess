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
  action?: "complete" | "reject" | "cancel";
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
    .select("id, applicant_name, applicant_reference, qualification, assignment_batch, assignment_title, assigned_at")
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
      workflow_status: (submissionById.get(applicant.applicant_reference)?.workflow_status ?? "under_review") as ApplicationSubmissionStatus,
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

  if ((action === "reject" || action === "cancel") && !reason) {
    return NextResponse.json(
      { success: false, message: "Please provide a reason before rejecting or cancelling this submission." },
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

  const nextStatus: ApplicationSubmissionStatus =
    action === "complete" ? "completed" : action === "reject" ? "rejected" : "cancelled";

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

  if (submission.workflow_status !== "assigned" && submission.workflow_status !== "under_review") {
    return NextResponse.json(
      {
        success: false,
        message: "Only assigned or under-review submissions can be finalized by the assessment center.",
      },
      { status: 400 },
    );
  }

  const processedAt = new Date().toISOString();
  const { error: updateError } = await adminSupabase
    .from("applicant_application_submissions")
    .update({
      latest_status_reason: reason || null,
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
      eventType:
        nextStatus === "completed"
          ? "assessment_center_completed"
          : nextStatus === "rejected"
            ? "assessment_center_rejected"
            : "assessment_center_cancelled",
      fromStatus: submission.workflow_status as ApplicationSubmissionStatus,
      metadata: {
        assessmentCenterId: center.id,
        assessmentCenterName: center.name,
      },
      notifications: [
        {
          message:
            nextStatus === "completed"
              ? `${center.name} marked your ${submission.qualification_title} application as completed.`
              : nextStatus === "rejected"
                ? `${center.name} rejected your ${submission.qualification_title} application.`
                : `${center.name} cancelled your ${submission.qualification_title} application.`,
          notificationType: nextStatus === "completed" ? "success" : nextStatus === "rejected" ? "error" : "warning",
          recipientEmail: submission.applicant_email,
          recipientRole: "applicant",
          recipientUserId: submission.applicant_id,
          submissionId: submission.id,
          title:
            nextStatus === "completed"
              ? "Application Completed"
              : nextStatus === "rejected"
                ? "Application Rejected"
                : "Application Cancelled",
        },
      ],
      reason,
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
    message:
      nextStatus === "completed"
        ? "Submission marked as completed."
        : nextStatus === "rejected"
          ? "Submission marked as rejected."
          : "Submission marked as cancelled.",
    reason: reason || null,
    workflowStatus: nextStatus,
  });
}
