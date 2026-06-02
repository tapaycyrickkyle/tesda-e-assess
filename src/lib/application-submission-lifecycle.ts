import type { ApplicationSubmissionSource, ApplicationSubmissionStatus } from "@/lib/application-form";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type SubmissionAssignmentInfo = {
  assigned_at: string;
  assessment_date: string | null;
  assessor: string | null;
  assessment_center_id: string;
  assessment_center_name: string | null;
  assignment_group_key: string | null;
  assignment_group_number: number | null;
};

type SubmissionEditLockParams = {
  assignment: SubmissionAssignmentInfo | null;
  submissionSource: ApplicationSubmissionSource;
  workflowStatus: ApplicationSubmissionStatus;
};

type ApplicantScopedAssignmentLookupParams = {
  applicantId: string;
  submissionIds: string[];
};

function normalizeSubmissionIds(submissionIds: string[]) {
  return [...new Set(submissionIds.map((submissionId) => submissionId.trim()).filter(Boolean))];
}

async function loadSubmissionAssignmentInfoByIds(submissionIds: string[]) {
  const normalizedSubmissionIds = normalizeSubmissionIds(submissionIds);
  const assignmentMap = new Map<string, SubmissionAssignmentInfo>();

  if (normalizedSubmissionIds.length === 0) {
    return assignmentMap;
  }

  const supabase = createSupabaseAdminClient();
  const { data: assignments, error: assignmentsError } = await supabase
    .from("assessment_center_applicants")
    .select(
      "assessment_center_id, applicant_reference, assigned_at, assessment_date, assessor, assignment_group_key, assignment_group_number",
    )
    .in("applicant_reference", normalizedSubmissionIds);

  if (assignmentsError || !assignments) {
    return assignmentMap;
  }

  const centerIds = [...new Set(assignments.map((assignment) => assignment.assessment_center_id).filter(Boolean))];
  const { data: centers } =
    centerIds.length > 0
      ? await supabase.from("assessment_centers").select("id, name").in("id", centerIds)
      : { data: [] as Array<{ id: string; name: string }> };

  const centerNameById = new Map((centers ?? []).map((center) => [center.id, center.name]));

  for (const assignment of assignments) {
    assignmentMap.set(assignment.applicant_reference, {
      assigned_at: assignment.assigned_at,
      assessment_date: assignment.assessment_date ?? null,
      assessor: assignment.assessor ?? null,
      assessment_center_id: assignment.assessment_center_id,
      assessment_center_name: centerNameById.get(assignment.assessment_center_id) ?? null,
      assignment_group_key: assignment.assignment_group_key ?? null,
      assignment_group_number: assignment.assignment_group_number ?? null,
    });
  }

  return assignmentMap;
}

export async function getSubmissionAssignmentInfoByIds(submissionIds: string[]) {
  return loadSubmissionAssignmentInfoByIds(submissionIds);
}

export async function getApplicantSubmissionAssignmentInfoByIds({
  applicantId,
  submissionIds,
}: ApplicantScopedAssignmentLookupParams) {
  const normalizedSubmissionIds = [...new Set(submissionIds.map((submissionId) => submissionId.trim()).filter(Boolean))];

  if (normalizedSubmissionIds.length === 0) {
    return new Map<string, SubmissionAssignmentInfo>();
  }

  const supabase = createSupabaseAdminClient();
  const { data: ownedSubmissions, error } = await supabase
    .from("applicant_application_submissions")
    .select("id")
    .eq("applicant_id", applicantId)
    .in("id", normalizedSubmissionIds);

  if (error || !ownedSubmissions) {
    return new Map<string, SubmissionAssignmentInfo>();
  }

  return loadSubmissionAssignmentInfoByIds(ownedSubmissions.map((submission) => submission.id));
}

export function getApplicantSubmissionEditLock({
  assignment,
  submissionSource,
  workflowStatus,
}: SubmissionEditLockParams) {
  if (
    workflowStatus === "passed" ||
    workflowStatus === "not_passed" ||
    workflowStatus === "completed" ||
    workflowStatus === "rejected" ||
    workflowStatus === "cancelled" ||
    workflowStatus === "withdrawn"
  ) {
    return {
      isLocked: true,
      message: `This submission is already ${workflowStatus} and can no longer be edited.`,
    };
  }

  if (assignment) {
    return {
      isLocked: true,
      message: assignment.assessment_center_name
        ? `This submission is already assigned to ${assignment.assessment_center_name} and can no longer be edited.`
        : "This submission is already assigned to an assessment center and can no longer be edited.",
    };
  }

  if (workflowStatus === "needs_applicant_update") {
    return {
      isLocked: false,
      message: null,
    };
  }

  if (submissionSource === "room" && workflowStatus === "submitted_to_admin") {
    return {
      isLocked: true,
      message: "This room submission has already been submitted to TESDA and can no longer be edited.",
    };
  }

  return {
    isLocked: false,
    message: null,
  };
}

export function getApplicantSubmissionWithdrawalLock({
  assignment,
  workflowStatus,
}: Omit<SubmissionEditLockParams, "submissionSource">) {
  if (
    workflowStatus === "passed" ||
    workflowStatus === "not_passed" ||
    workflowStatus === "completed" ||
    workflowStatus === "rejected" ||
    workflowStatus === "cancelled" ||
    workflowStatus === "withdrawn"
  ) {
    return {
      isLocked: true,
      message: `This submission is already ${workflowStatus} and can no longer be withdrawn.`,
    };
  }

  if (
    assignment ||
    workflowStatus === "assigned" ||
    workflowStatus === "under_review" ||
    workflowStatus === "for_result_encoding"
  ) {
    return {
      isLocked: true,
      message: "This submission is already being processed by an assessment center and can no longer be withdrawn.",
    };
  }

  if (workflowStatus !== "submitted_to_teacher" && workflowStatus !== "submitted_to_admin") {
    return {
      isLocked: true,
      message: "Only submitted applications can be withdrawn.",
    };
  }

  return {
    isLocked: false,
    message: null,
  };
}
