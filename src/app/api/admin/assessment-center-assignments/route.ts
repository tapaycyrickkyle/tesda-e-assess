import { NextResponse } from "next/server";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition } from "@/lib/workflow-history";

type ApplicantAssignmentPayload = {
  applicantName?: string;
  applicantReference?: string;
  assignmentBatch?: string | null;
  assignmentTitle?: string | null;
  qualification?: string;
};

type CreateAssessmentCenterAssignmentsPayload = {
  applicants?: ApplicantAssignmentPayload[];
  assessmentCenterId?: string;
};

type DeleteAssessmentCenterAssignmentsPayload = {
  assignmentIds?: string[];
};

type AssessmentCenterAssignmentRecord = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assignment_batch?: string | null;
  assignment_title?: string | null;
  assessment_center_id: string;
  id: string;
  qualification: string;
};

function isMissingAssignmentTitleError(error: { code?: string | null; message?: string | null } | null) {
  if (!error) {
    return false;
  }

  const errorMessage = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  return errorMessage.includes("assignment_title");
}

async function loadAssessmentCenterAssignments() {
  const supabase = createSupabaseAdminClient();
  const fullSelection =
    "id, assessment_center_id, applicant_reference, applicant_name, qualification, assignment_batch, assignment_title, assigned_at";
  const fallbackSelection =
    "id, assessment_center_id, applicant_reference, applicant_name, qualification, assignment_batch, assigned_at";

  const fullQuery = await supabase
    .from("assessment_center_applicants")
    .select(fullSelection)
    .order("assigned_at", { ascending: false });

  if (!isMissingAssignmentTitleError(fullQuery.error)) {
    return {
      data: (fullQuery.data ?? []) as AssessmentCenterAssignmentRecord[],
      error: fullQuery.error,
    };
  }

  const fallbackQuery = await supabase
    .from("assessment_center_applicants")
    .select(fallbackSelection)
    .order("assigned_at", { ascending: false });

  return {
    data: ((fallbackQuery.data ?? []) as AssessmentCenterAssignmentRecord[]).map((assignment) => ({
      ...assignment,
      assignment_title: null,
    })),
    error: fallbackQuery.error,
  };
}

async function upsertAssessmentCenterAssignments(
  payload: Array<{
    applicant_name: string;
    applicant_reference: string;
    assignment_batch: string | null;
    assignment_title: string | null;
    assessment_center_id: string;
    assigned_by: string;
    assigned_by_email: string;
    qualification: string;
  }>,
) {
  const supabase = createSupabaseAdminClient();

  const fullUpsert = await supabase.from("assessment_center_applicants").upsert(payload, {
    onConflict: "assessment_center_id,applicant_reference",
  });

  if (!isMissingAssignmentTitleError(fullUpsert.error)) {
    return fullUpsert;
  }

  return supabase.from("assessment_center_applicants").upsert(
    payload.map((assignment) => ({
      applicant_name: assignment.applicant_name,
      applicant_reference: assignment.applicant_reference,
      assignment_batch: assignment.assignment_batch,
      assessment_center_id: assignment.assessment_center_id,
      assigned_by: assignment.assigned_by,
      assigned_by_email: assignment.assigned_by_email,
      qualification: assignment.qualification,
    })),
    {
      onConflict: "assessment_center_id,applicant_reference",
    },
  );
}

export async function POST(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as CreateAssessmentCenterAssignmentsPayload;
  const assessmentCenterId = body.assessmentCenterId?.trim() ?? "";
  const applicants = body.applicants ?? [];

  if (!assessmentCenterId || applicants.length === 0) {
    return NextResponse.json(
      { success: false, message: "Assessment center and applicant assignment details are required." },
      { status: 400 },
    );
  }

  const normalizedApplicants = applicants
    .map((applicant) => ({
      applicant_name: applicant.applicantName?.trim() ?? "",
      applicant_reference: applicant.applicantReference?.trim() ?? "",
      assignment_batch: applicant.assignmentBatch?.trim() ?? null,
      assignment_title: applicant.assignmentTitle?.trim() ?? null,
      qualification: applicant.qualification?.trim() ?? "",
    }))
    .filter(
      (applicant) =>
        applicant.applicant_name.length > 0 &&
        applicant.applicant_reference.length > 0 &&
        applicant.qualification.length > 0,
    );

  if (normalizedApplicants.length === 0) {
    return NextResponse.json(
      { success: false, message: "At least one valid applicant assignment is required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: center, error: centerError } = await supabase
    .from("assessment_centers")
    .select("id, name, center_email, center_auth_user_id")
    .eq("id", assessmentCenterId)
    .maybeSingle();

  if (centerError || !center) {
    return NextResponse.json({ success: false, message: "Selected assessment center was not found." }, { status: 404 });
  }

  const submissionIds = normalizedApplicants.map((applicant) => applicant.applicant_reference);
  const { data: matchedSubmissions, error: submissionsLookupError } = await supabase
    .from("applicant_application_submissions")
    .select("id, applicant_id, applicant_email, applicant_name, qualification_title, workflow_status")
    .in("id", submissionIds);

  if (submissionsLookupError) {
    console.error("Admin assignment submission lookup failed.", submissionsLookupError);
    return NextResponse.json(
      { success: false, message: "Unable to verify applicant submission statuses before assignment." },
      { status: 500 },
    );
  }

  const matchedSubmissionIds = new Set((matchedSubmissions ?? []).map((submission) => submission.id));
  const missingSubmissionIds = submissionIds.filter((submissionId) => !matchedSubmissionIds.has(submissionId));

  if (missingSubmissionIds.length > 0) {
    return NextResponse.json(
      { success: false, message: "One or more applicant submissions could not be found for assignment." },
      { status: 404 },
    );
  }

  const invalidStatuses = new Set<ApplicationSubmissionStatus>(["completed", "rejected", "cancelled", "withdrawn"]);
  const blockedSubmissions = (matchedSubmissions ?? []).filter((submission) =>
    invalidStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  );

  if (blockedSubmissions.length > 0) {
    return NextResponse.json(
      { success: false, message: "Completed, rejected, cancelled, or withdrawn submissions cannot be assigned." },
      { status: 400 },
    );
  }

  const nonQueueSubmissions = (matchedSubmissions ?? []).filter(
    (submission) => submission.workflow_status !== "submitted_to_admin",
  );

  if (nonQueueSubmissions.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Only submissions already submitted to TESDA can be assigned to an assessment center.",
      },
      { status: 400 },
    );
  }

  const { data: existingAssignments, error: existingAssignmentsError } = await supabase
    .from("assessment_center_applicants")
    .select("assessment_center_id, applicant_reference")
    .in("applicant_reference", submissionIds);

  if (existingAssignmentsError) {
    console.error("Admin existing assignment lookup failed.", existingAssignmentsError);
    return NextResponse.json(
      { success: false, message: "Unable to verify existing assignment ownership before saving." },
      { status: 500 },
    );
  }

  const conflictingAssignments = (existingAssignments ?? []).filter(
    (assignment) => assignment.assessment_center_id !== assessmentCenterId,
  );

  if (conflictingAssignments.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message: "One or more submissions are already assigned to another assessment center. Remove the existing assignment first.",
      },
      { status: 400 },
    );
  }

  const existingAssignmentSubmissionIds = new Set((existingAssignments ?? []).map((assignment) => assignment.applicant_reference));
  const newAssignmentSubmissionIds = submissionIds.filter((submissionId) => !existingAssignmentSubmissionIds.has(submissionId));

  const { error } = await upsertAssessmentCenterAssignments(
    normalizedApplicants.map((applicant) => ({
      ...applicant,
      assessment_center_id: assessmentCenterId,
      assigned_by: currentUser.id,
      assigned_by_email: currentUser.email,
    })),
  );

  if (error) {
    console.error("Admin assignment upsert failed.", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to assign applicants. Make sure the `assessment_center_applicants` table exists and its policies allow admin inserts.",
      },
      { status: 500 },
    );
  }

  const assignedAt = new Date().toISOString();
  const { error: submissionStatusError } = await supabase
    .from("applicant_application_submissions")
    .update({
      latest_status_reason: null,
      latest_status_updated_at: assignedAt,
      updated_at: assignedAt,
      workflow_status: "under_review",
    })
    .in("id", submissionIds);

  if (submissionStatusError) {
    console.error("Admin submission status update after assignment failed.", submissionStatusError);

    if (newAssignmentSubmissionIds.length > 0) {
      const { error: rollbackError } = await supabase
        .from("assessment_center_applicants")
        .delete()
        .eq("assessment_center_id", assessmentCenterId)
        .in("applicant_reference", newAssignmentSubmissionIds);

      if (rollbackError) {
        console.error("Admin assignment rollback after submission status failure failed.", rollbackError);
      }
    }

    return NextResponse.json(
      { success: false, message: "Applicants were assigned, but submission statuses could not be updated safely." },
      { status: 500 },
    );
  }

  try {
    const normalizedApplicantBySubmissionId = new Map(
      normalizedApplicants.map((applicant) => [applicant.applicant_reference, applicant]),
    );

    await Promise.all(
      (matchedSubmissions ?? []).map((submission) =>
        recordSubmissionWorkflowTransition({
          actor: currentUser,
          eventType: "admin_assigned_to_center",
          fromStatus: submission.workflow_status as ApplicationSubmissionStatus,
          metadata: {
            assessmentCenterId: center.id,
            assessmentCenterName: center.name,
            assignmentBatch: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_batch ?? null,
            assignmentTitle: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_title ?? null,
          },
          notifications: [
            {
              message: `${center.name} is now handling your ${submission.qualification_title} application.`,
              notificationType: "success",
              recipientEmail: submission.applicant_email,
              recipientRole: "applicant",
              recipientUserId: submission.applicant_id,
              submissionId: submission.id,
              title: "Assessment Center Assigned",
            },
            ...(center.center_email
              ? [
                  {
                    message: `${submission.applicant_name} (${submission.qualification_title}) was assigned to ${center.name}.`,
                    notificationType: "info",
                    recipientEmail: center.center_email,
                    recipientRole: "assessment_center" as const,
                    recipientUserId: center.center_auth_user_id,
                    submissionId: submission.id,
                    title: "New Applicant Assignment",
                  },
                ]
              : []),
          ],
          submissionId: submission.id,
          toStatus: "under_review",
        }),
      ),
    );
  } catch (historyError) {
    console.error("Failed to record admin assignment workflow history.", {
      assessmentCenterId,
      error: historyError,
    });
  }

  return NextResponse.json({ success: true, message: "Applicants assigned successfully." });
}

export async function DELETE(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as DeleteAssessmentCenterAssignmentsPayload;
  const assignmentIds = (body.assignmentIds ?? []).map((assignmentId) => assignmentId.trim()).filter(Boolean);

  if (assignmentIds.length === 0) {
    return NextResponse.json(
      { success: false, message: "At least one assignment must be selected for removal." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: assignments, error: assignmentLookupError } = await supabase
    .from("assessment_center_applicants")
    .select("id, applicant_reference")
    .in("id", assignmentIds);

  if (assignmentLookupError) {
    console.error("Admin assignment removal lookup failed.", assignmentLookupError);
    return NextResponse.json(
      { success: false, message: "Unable to verify assignment records before removal." },
      { status: 500 },
    );
  }

  const submissionIds = (assignments ?? []).map((assignment) => assignment.applicant_reference);
  const { data: submissions, error: submissionLookupError } = submissionIds.length
    ? await supabase
        .from("applicant_application_submissions")
        .select("id, applicant_id, applicant_email, applicant_name, qualification_title, submission_source, workflow_status")
        .in("id", submissionIds)
    : { data: [], error: null };

  if (submissionLookupError) {
    console.error("Admin linked submission lookup before removal failed.", submissionLookupError);
    return NextResponse.json(
      { success: false, message: "Unable to verify linked submission statuses before removal." },
      { status: 500 },
    );
  }

  const nonAssignableStatuses = new Set<ApplicationSubmissionStatus>([
    "under_review",
    "completed",
    "rejected",
    "cancelled",
    "withdrawn",
  ]);
  const lockedSubmissions = (submissions ?? []).filter((submission) =>
    nonAssignableStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  );

  if (lockedSubmissions.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Under-review or finalized submissions cannot be returned to the submitted queue. Mark them through the submission status flow instead.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("assessment_center_applicants").delete().in("id", assignmentIds);

  if (error) {
    console.error("Admin assignment delete failed.", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to remove the assignment. Make sure the assessment center assignment table exists and admins can delete records.",
      },
      { status: 500 },
    );
  }

  if (submissionIds.length > 0) {
    const revertedAt = new Date().toISOString();
    const { error: revertError } = await supabase
      .from("applicant_application_submissions")
      .update({
        latest_status_reason: null,
        latest_status_updated_at: revertedAt,
        updated_at: revertedAt,
        workflow_status: "submitted_to_admin",
      })
      .in("id", submissionIds);

    if (revertError) {
      console.error("Admin submission status revert after assignment removal failed.", revertError);
      return NextResponse.json(
        { success: false, message: "Assignments were removed, but submission statuses could not be restored safely." },
        { status: 500 },
      );
    }

    try {
      await Promise.all(
        (submissions ?? []).map((submission) =>
          recordSubmissionWorkflowTransition({
            actor: currentUser,
            eventType: "admin_returned_to_queue",
            fromStatus: submission.workflow_status as ApplicationSubmissionStatus,
            notifications: [
              {
                message: `Your ${submission.qualification_title} application was returned to the TESDA queue for reassignment.`,
                notificationType: "warning",
                recipientEmail: submission.applicant_email,
                recipientRole: "applicant",
                recipientUserId: submission.applicant_id,
                submissionId: submission.id,
                title: "Assignment Returned to Queue",
              },
            ],
            submissionId: submission.id,
            toStatus: "submitted_to_admin",
          }),
        ),
      );
    } catch (historyError) {
      console.error("Failed to record admin assignment removal workflow history.", {
        error: historyError,
        submissionIds,
      });
    }
  }

  return NextResponse.json({ success: true, message: "Assignment removed successfully." });
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
  const [{ data: applicants, error: applicantsError }, { data: centers, error: centersError }] = await Promise.all([
    loadAssessmentCenterAssignments(),
    supabase.from("assessment_centers").select("id, name"),
  ]);

  if (applicantsError || centersError) {
    console.error("Admin assigned applicants load failed.", {
      applicantsError,
      centersError,
    });
    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load assigned applicants. Make sure the assessment center assignment tables exist and admins can read them.",
      },
      { status: 500 },
    );
  }

  const submissionIds = (applicants ?? []).map((applicant) => applicant.applicant_reference);
  const { data: submissions, error: submissionsError } = submissionIds.length
    ? await supabase
        .from("applicant_application_submissions")
        .select("id, workflow_status")
        .in("id", submissionIds)
    : { data: [], error: null };

  if (submissionsError) {
    console.error("Admin assigned applicant submission status load failed.", submissionsError);
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load linked submission statuses for assigned applicants.",
      },
      { status: 500 },
    );
  }

  const centerNamesById = new Map((centers ?? []).map((center) => [center.id, center.name]));
  const submissionStatusById = new Map((submissions ?? []).map((submission) => [submission.id, submission.workflow_status]));
  const normalizedApplicants = (applicants ?? []).map((applicant) => ({
    ...applicant,
    center_name: centerNamesById.get(applicant.assessment_center_id) ?? "Unknown Center",
    workflow_status: (submissionStatusById.get(applicant.applicant_reference) ?? "under_review") as ApplicationSubmissionStatus,
  }));

  return NextResponse.json({ success: true, applicants: normalizedApplicants });
}
