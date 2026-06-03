import { NextResponse } from "next/server";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { recordSubmissionWorkflowTransition } from "@/lib/workflow-history";

type ApplicantAssignmentPayload = {
  applicantName?: string;
  applicantReference?: string;
  assignmentBatch?: string | null;
  assignmentGroupKey?: string | null;
  assignmentGroupNumber?: number | null;
  assignmentTitle?: string | null;
  qualification?: string;
};

type CreateAssessmentCenterAssignmentsPayload = {
  applicants?: ApplicantAssignmentPayload[];
  assessmentCenterId?: string;
  assessmentDate?: string;
  assessor?: string;
};

type UpdateAssessmentCenterAssignmentsPayload = {
  action?: "update_schedule";
  assessmentDate?: string;
  assessor?: string;
  assignmentIds?: string[];
};

type DeleteAssessmentCenterAssignmentsPayload = {
  assignmentIds?: string[];
};

type AssessmentCenterAssignmentRecord = {
  applicant_name: string;
  applicant_reference: string;
  assigned_at: string;
  assessment_date: string | null;
  assessment_center_id: string;
  assessor: string | null;
  assignment_batch: string | null;
  assignment_group_key: string | null;
  assignment_group_number: number | null;
  assignment_title: string | null;
  id: string;
  qualification: string;
  schedule_updated_at: string | null;
};

async function loadAssessmentCenterAssignments() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("assessment_center_applicants")
    .select(
      "id, assessment_center_id, applicant_reference, applicant_name, qualification, assignment_batch, assignment_group_key, assignment_group_number, assignment_title, assessment_date, assessor, assigned_at, schedule_updated_at",
    )
    .order("assigned_at", { ascending: false });

  return {
    data: (data ?? []) as AssessmentCenterAssignmentRecord[],
    error,
  };
}

async function upsertAssessmentCenterAssignments(
  payload: Array<{
    applicant_name: string;
    applicant_reference: string;
    assessment_date: string;
    assessment_center_id: string;
    assessor: string;
    assignment_batch: string | null;
    assignment_group_key: string | null;
    assignment_group_number: number | null;
    assignment_title: string | null;
    assigned_by: string;
    assigned_by_email: string;
    qualification: string;
    schedule_updated_at: string;
    schedule_updated_by: string;
    schedule_updated_by_email: string;
  }>,
) {
  const supabase = createSupabaseAdminClient();

  return supabase.from("assessment_center_applicants").upsert(payload, {
    onConflict: "assessment_center_id,applicant_reference",
  });
}

function normalizeAssignmentApplicants(applicants: ApplicantAssignmentPayload[]) {
  return applicants
    .map((applicant) => ({
      applicant_name: applicant.applicantName?.trim() ?? "",
      applicant_reference: applicant.applicantReference?.trim() ?? "",
      assignment_batch: applicant.assignmentBatch?.trim() ?? null,
      assignment_group_key: applicant.assignmentGroupKey?.trim() ?? null,
      assignment_group_number:
        typeof applicant.assignmentGroupNumber === "number" && Number.isInteger(applicant.assignmentGroupNumber)
          ? applicant.assignmentGroupNumber
          : null,
      assignment_title: applicant.assignmentTitle?.trim() ?? null,
      qualification: applicant.qualification?.trim() ?? "",
    }))
    .filter(
      (applicant) =>
        applicant.applicant_name.length > 0 &&
        applicant.applicant_reference.length > 0 &&
        applicant.qualification.length > 0,
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
  const assessmentDate = body.assessmentDate?.trim() ?? "";
  const assessor = body.assessor?.trim() ?? "";
  const normalizedApplicants = normalizeAssignmentApplicants(body.applicants ?? []);

  if (!assessmentCenterId || !assessmentDate || !assessor || normalizedApplicants.length === 0) {
    return NextResponse.json(
      {
        success: false,
        message: "Assessment center, assessment date, assessor, and valid applicant assignment details are required.",
      },
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

  const invalidStatuses = new Set<ApplicationSubmissionStatus>([
    "passed",
    "not_passed",
    "completed",
    "rejected",
    "cancelled",
    "withdrawn",
    "needs_applicant_update",
    "submitted_to_teacher",
  ]);
  const blockedSubmissions = (matchedSubmissions ?? []).filter((submission) =>
    invalidStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  );

  if (blockedSubmissions.length > 0) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Only active TESDA-queue submissions can be assigned. Finalized, teacher-queue, or applicant-correction submissions are blocked.",
      },
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
  const scheduleUpdatedAt = new Date().toISOString();
  const { error } = await upsertAssessmentCenterAssignments(
    normalizedApplicants.map((applicant) => ({
      ...applicant,
      assessment_date: assessmentDate,
      assessment_center_id: assessmentCenterId,
      assessor,
      assigned_by: currentUser.id,
      assigned_by_email: currentUser.email,
      qualification: applicant.qualification,
      schedule_updated_at: scheduleUpdatedAt,
      schedule_updated_by: currentUser.id,
      schedule_updated_by_email: currentUser.email,
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
      workflow_status: "assigned",
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
            assessmentDate,
            assessor,
            assignmentBatch: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_batch ?? null,
            assignmentGroupKey: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_group_key ?? null,
            assignmentGroupNumber: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_group_number ?? null,
            assignmentTitle: normalizedApplicantBySubmissionId.get(submission.id)?.assignment_title ?? null,
          },
          notifications: [
            {
              message: `${center.name} is now handling your ${submission.qualification_title} application on ${assessmentDate} with assessor ${assessor}.`,
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
                    message: `${submission.applicant_name} (${submission.qualification_title}) was assigned to ${center.name} on ${assessmentDate} with assessor ${assessor}.`,
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
          toStatus: "assigned",
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

export async function PATCH(request: Request) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    return NextResponse.json({ success: false, message: "You must be logged in." }, { status: 401 });
  }

  if (currentUser.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access is required." }, { status: 403 });
  }

  const body = (await request.json()) as UpdateAssessmentCenterAssignmentsPayload;
  const action = body.action;
  const assignmentIds = [...new Set((body.assignmentIds ?? []).map((assignmentId) => assignmentId.trim()).filter(Boolean))];
  const assessmentDate = body.assessmentDate?.trim() ?? "";
  const assessor = body.assessor?.trim() ?? "";

  if (action !== "update_schedule" || assignmentIds.length === 0 || !assessmentDate || !assessor) {
    return NextResponse.json(
      { success: false, message: "Assignment selections, assessment date, and assessor are required." },
      { status: 400 },
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assessment_center_applicants")
    .select("id, applicant_reference, assessment_center_id")
    .in("id", assignmentIds);

  if (assignmentsError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify the selected assignments." },
      { status: 500 },
    );
  }

  if (!assignments || assignments.length !== assignmentIds.length) {
    return NextResponse.json(
      { success: false, message: "One or more selected assignments could not be found." },
      { status: 404 },
    );
  }

  const submissionIds = assignments.map((assignment) => assignment.applicant_reference);
  const centerIds = [...new Set((assignments ?? []).map((assignment) => assignment.assessment_center_id).filter(Boolean))];
  const [{ data: submissions, error: submissionsError }, { data: centers, error: centersError }] = await Promise.all([
    supabase
      .from("applicant_application_submissions")
      .select("id, applicant_id, applicant_email, qualification_title, workflow_status")
      .in("id", submissionIds),
    centerIds.length > 0
      ? supabase.from("assessment_centers").select("id, name, center_email, center_auth_user_id").in("id", centerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (submissionsError || centersError) {
    return NextResponse.json(
      { success: false, message: "Unable to verify the linked submission or center details." },
      { status: 500 },
    );
  }

  const blockedStatuses = new Set<ApplicationSubmissionStatus>([
    "passed",
    "not_passed",
    "completed",
    "rejected",
    "cancelled",
    "withdrawn",
  ]);
  const blockedSubmission = (submissions ?? []).find((submission) =>
    blockedStatuses.has(submission.workflow_status as ApplicationSubmissionStatus),
  );

  if (blockedSubmission) {
    return NextResponse.json(
      { success: false, message: "Finalized submissions can no longer be rescheduled." },
      { status: 400 },
    );
  }

  const updatedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("assessment_center_applicants")
    .update({
      assessment_date: assessmentDate,
      assessor,
      schedule_updated_at: updatedAt,
      schedule_updated_by: currentUser.id,
      schedule_updated_by_email: currentUser.email,
    })
    .in("id", assignmentIds);

  if (updateError) {
    return NextResponse.json(
      { success: false, message: "Unable to update the assignment schedule right now." },
      { status: 500 },
    );
  }

  try {
    const assignmentBySubmissionId = new Map((assignments ?? []).map((assignment) => [assignment.applicant_reference, assignment]));
    const centerById = new Map((centers ?? []).map((center) => [center.id, center]));

    await Promise.all(
      (submissions ?? []).map((submission) => {
        const linkedAssignment = assignmentBySubmissionId.get(submission.id);
        const linkedCenter = linkedAssignment ? centerById.get(linkedAssignment.assessment_center_id) ?? null : null;

        return recordSubmissionWorkflowTransition({
          actor: currentUser,
          eventType: "admin_rescheduled_assessment",
          fromStatus: submission.workflow_status as ApplicationSubmissionStatus,
          metadata: {
            assessmentCenterId: linkedCenter?.id ?? null,
            assessmentCenterName: linkedCenter?.name ?? null,
            assessmentDate,
            assessor,
          },
          notifications: [
            {
              message: `Your assessment schedule was updated to ${assessmentDate} with assessor ${assessor}.`,
              notificationType: "info",
              recipientEmail: submission.applicant_email,
              recipientRole: "applicant",
              recipientUserId: submission.applicant_id,
              submissionId: submission.id,
              title: "Assessment Schedule Updated",
            },
            ...(linkedCenter?.center_email
              ? [
                  {
                    message: `${submission.qualification_title} was rescheduled to ${assessmentDate} with assessor ${assessor}.`,
                    notificationType: "info",
                    recipientEmail: linkedCenter.center_email,
                    recipientRole: "assessment_center" as const,
                    recipientUserId: linkedCenter.center_auth_user_id,
                    submissionId: submission.id,
                    title: "Center Schedule Updated",
                  },
                ]
              : []),
          ],
          submissionId: submission.id,
          toStatus: submission.workflow_status as ApplicationSubmissionStatus,
        });
      }),
    );
  } catch (historyError) {
    console.error("Failed to record admin schedule update workflow history.", {
      assignmentIds,
      error: historyError,
    });
  }

  return NextResponse.json({
    success: true,
    message:
      assignmentIds.length === 1
        ? "Assignment schedule updated successfully."
        : `${assignmentIds.length} assignment schedules updated successfully.`,
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

  const body = (await request.json()) as DeleteAssessmentCenterAssignmentsPayload;
  const assignmentIds = [...new Set((body.assignmentIds ?? []).map((assignmentId) => assignmentId.trim()).filter(Boolean))];

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
        .select("id, applicant_id, applicant_email, qualification_title, workflow_status")
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
    "for_result_encoding",
    "passed",
    "not_passed",
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
