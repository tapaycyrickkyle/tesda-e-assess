import { NextResponse } from "next/server";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition } from "@/lib/workflow-history";

type RequestApplicantUpdatePayload = {
  action?: "request_update";
  reason?: string | null;
  submissionIds?: string[];
};

const returnableStatuses = new Set<ApplicationSubmissionStatus>(["submitted_to_admin"]);

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as RequestApplicantUpdatePayload;
  const action = body.action;
  const submissionIds = [...new Set((body.submissionIds ?? []).map((submissionId) => submissionId.trim()).filter(Boolean))];
  const reason = body.reason?.trim() ?? "";

  if (action !== "request_update" || submissionIds.length === 0 || !reason) {
    return NextResponse.json(
      { success: false, message: "Submission selections and correction instructions are required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: submissions, error: submissionsError } = await supabase
    .from("applicant_application_submissions")
    .select("id, applicant_id, applicant_email, applicant_name, qualification_title, workflow_status")
    .in("id", submissionIds);

  if (submissionsError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify the selected submissions." },
      { status: 500 },
    );
  }

  if (!submissions || submissions.length !== submissionIds.length) {
    return NextResponse.json(
      { success: false, message: "One or more selected submissions could not be found." },
      { status: 404 },
    );
  }

  const blockedSubmissions = submissions.filter(
    (submission) => !returnableStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  );

  if (blockedSubmissions.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Only queued submissions that have not yet been assigned to an assessment center can be returned for applicant correction.",
      },
      { status: 400 },
    );
  }

  const alreadyReturned = submissions.filter((submission) => submission.workflow_status === "needs_applicant_update");

  if (alreadyReturned.length > 0) {
    return NextResponse.json(
      { success: false, message: "One or more selected submissions are already waiting for applicant updates." },
      { status: 400 },
    );
  }

  const requestedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("applicant_application_submissions")
    .update({
      latest_status_reason: reason,
      latest_status_updated_at: requestedAt,
      updated_at: requestedAt,
      workflow_status: "needs_applicant_update" satisfies ApplicationSubmissionStatus,
    })
    .in("id", submissionIds);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Unable to return the selected submissions for applicant correction." },
      { status: 500 },
    );
  }

  try {
    await Promise.all(
      submissions.map((submission) => {
        return recordSubmissionWorkflowTransition({
          actor: currentUser,
          eventType: "admin_requested_applicant_update",
          fromStatus: submission.workflow_status as ApplicationSubmissionStatus,
          notifications: [
            {
              message: `TESDA returned your ${submission.qualification_title} application for correction. Review the instructions and resubmit the updated form.`,
              metadata: {
                correctionReason: reason,
              },
              notificationType: "warning",
              recipientEmail: submission.applicant_email,
              recipientRole: "applicant",
              recipientUserId: submission.applicant_id,
              submissionId: submission.id,
              title: "Application Needs Update",
            },
          ],
          reason,
          submissionId: submission.id,
          toStatus: "needs_applicant_update",
        });
      }),
    );
  } catch (historyError) {
    console.error("Failed to record applicant correction-request workflow history.", {
      error: historyError,
      submissionIds,
    });
  }

  return NextResponse.json({
    success: true,
    message:
      submissionIds.length === 1
        ? "The submission was returned to the applicant for correction."
        : `${submissionIds.length} submissions were returned to applicants for correction.`,
  });
}
