import { formatAssessmentDate } from "@/lib/assessment-date";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";
import type { UserRole } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

export type WorkflowActor = {
  email: string;
  id: string;
  role: UserRole;
};

export type SubmissionHistoryEntry = {
  actor_email: string | null;
  actor_role: string | null;
  actor_user_id: string | null;
  created_at: string;
  event_type: string;
  from_status: ApplicationSubmissionStatus | null;
  id: string;
  metadata: Record<string, unknown>;
  reason: string | null;
  submission_id: string;
  to_status: ApplicationSubmissionStatus | null;
};

export type PortalNotificationEntry = {
  created_at: string;
  id: string;
  is_read: boolean;
  message: string;
  metadata: Record<string, unknown>;
  notification_type: string;
  recipient_email: string;
  recipient_role: string;
  recipient_user_id: string | null;
  submission_id: string | null;
  title: string;
};

export type PortalNotificationInput = {
  message: string;
  metadata?: Record<string, unknown>;
  notificationType?: string;
  recipientEmail: string;
  recipientRole: UserRole;
  recipientUserId?: string | null;
  submissionId?: string | null;
  title: string;
};

export type SubmissionReportRow = {
  applicant_email: string;
  applicant_name: string;
  assigned_at: string | null;
  assessment_date: string | null;
  assessment_center_name: string | null;
  assessor: string | null;
  assignment_group_key: string | null;
  assignment_group_number: number | null;
  id: string;
  latest_status_reason: string | null;
  latest_status_updated_at: string | null;
  qualification_title: string;
  room_name: string | null;
  submission_source: "individual" | "room";
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: ApplicationSubmissionStatus;
};

type WorkflowTransitionInput = {
  actor: WorkflowActor;
  eventType: string;
  fromStatus: ApplicationSubmissionStatus | null;
  metadata?: Record<string, unknown>;
  notifications?: PortalNotificationInput[];
  reason?: string | null;
  submissionId: string;
  toStatus: ApplicationSubmissionStatus | null;
};

function normalizeMetadata(metadata?: Record<string, unknown>) {
  return metadata && Object.keys(metadata).length > 0 ? metadata : {};
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function asPlainRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function escapeCsv(value: string | null | undefined) {
  const normalized = value ?? "";
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
}

export async function recordSubmissionWorkflowTransition({
  actor,
  eventType,
  fromStatus,
  metadata,
  notifications,
  reason,
  submissionId,
  toStatus,
}: WorkflowTransitionInput) {
  const supabase = createSupabaseAdminClient();
  const normalizedReason = normalizeOptionalText(reason);

  const { error: eventError } = await supabase.from("application_submission_events").insert({
    actor_email: actor.email,
    actor_role: actor.role,
    actor_user_id: actor.id,
    event_type: eventType,
    from_status: fromStatus,
    metadata: normalizeMetadata(metadata),
    reason: normalizedReason,
    submission_id: submissionId,
    to_status: toStatus,
  });

  if (eventError) {
    throw new Error("Unable to save the workflow history entry.");
  }

  if (notifications && notifications.length > 0) {
    const { error: notificationError } = await supabase.from("portal_notifications").insert(
      notifications.map((notification) => ({
        is_read: false,
        message: notification.message,
        metadata: normalizeMetadata(notification.metadata),
        notification_type: notification.notificationType ?? "info",
        recipient_email: notification.recipientEmail,
        recipient_role: notification.recipientRole,
        recipient_user_id: notification.recipientUserId ?? null,
        submission_id: notification.submissionId ?? submissionId,
        title: notification.title,
      })),
    );

    if (notificationError) {
      throw new Error("Unable to save the workflow notification.");
    }
  }

  if (toStatus) {
    const { error: submissionError } = await supabase
      .from("applicant_application_submissions")
      .update({
        latest_status_reason: normalizedReason,
        latest_status_updated_at: new Date().toISOString(),
      })
      .eq("id", submissionId);

    if (submissionError) {
      throw new Error("Unable to save the submission status details.");
    }
  }
}

export async function loadSubmissionHistoryByIds(submissionIds: string[]) {
  const normalizedSubmissionIds = [...new Set(submissionIds.map((submissionId) => submissionId.trim()).filter(Boolean))];
  const historyMap = new Map<string, SubmissionHistoryEntry[]>();

  if (normalizedSubmissionIds.length === 0) {
    return historyMap;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("application_submission_events")
    .select("id, submission_id, event_type, from_status, to_status, reason, actor_user_id, actor_email, actor_role, metadata, created_at")
    .in("submission_id", normalizedSubmissionIds)
    .order("created_at", { ascending: false });

  if (error) {
    return historyMap;
  }

  for (const entry of data ?? []) {
    const normalizedEntry: SubmissionHistoryEntry = {
      ...entry,
      metadata: asPlainRecord(entry.metadata),
    };
    const currentEntries = historyMap.get(entry.submission_id) ?? [];
    currentEntries.push(normalizedEntry);
    historyMap.set(entry.submission_id, currentEntries);
  }

  return historyMap;
}

export async function loadRecentWorkflowEvents(limit = 8) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("application_submission_events")
    .select(
      "id, submission_id, event_type, from_status, to_status, reason, actor_user_id, actor_email, actor_role, metadata, created_at, applicant_application_submissions(applicant_name, qualification_title)",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []).map((entry) => {
    const submissionDetails = Array.isArray(entry.applicant_application_submissions)
      ? entry.applicant_application_submissions[0]
      : entry.applicant_application_submissions;

    return {
      ...entry,
      applicant_name: submissionDetails?.applicant_name ?? "Applicant",
      metadata: asPlainRecord(entry.metadata),
      qualification_title: submissionDetails?.qualification_title ?? "Application",
    };
  });
}

export async function loadNotificationsForUser({
  email,
  limit = 20,
  userId,
}: {
  email: string;
  limit?: number;
  userId: string;
}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portal_notifications")
    .select("id, recipient_user_id, recipient_email, recipient_role, title, message, notification_type, submission_id, is_read, metadata, created_at")
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return (data ?? []).map(
    (entry) =>
      ({
        ...entry,
        metadata: asPlainRecord(entry.metadata),
      }) satisfies PortalNotificationEntry,
  );
}

export async function markNotificationsRead({
  email,
  notificationIds,
  userId,
}: {
  email: string;
  notificationIds?: string[];
  userId: string;
}) {
  const normalizedIds = [...new Set((notificationIds ?? []).map((notificationId) => notificationId.trim()).filter(Boolean))];
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("portal_notifications")
    .update({ is_read: true })
    .or(`recipient_user_id.eq.${userId},recipient_email.ilike.${email}`)
    .eq("is_read", false);

  if (normalizedIds.length > 0) {
    query = query.in("id", normalizedIds);
  }

  const { error } = await query;

  if (error) {
    throw new Error("Unable to update notifications right now.");
  }
}

export function getWorkflowEventLabel(event: Pick<SubmissionHistoryEntry, "event_type" | "to_status">) {
  switch (event.event_type) {
    case "applicant_submitted":
      return "Submitted to TESDA";
    case "applicant_submitted_to_teacher":
      return "Submitted to Teacher";
    case "applicant_resubmitted":
      return "Resubmitted";
    case "admin_requested_applicant_update":
      return "Returned for Applicant Update";
    case "admin_rescheduled_assessment":
      return "Assessment Rescheduled";
    case "teacher_forwarded_to_admin":
      return "Forwarded to TESDA";
    case "admin_assigned_to_center":
      return "Assigned to Assessment Center";
    case "admin_returned_to_queue":
      return "Returned to TESDA Queue";
    case "applicant_withdrew":
      return "Withdrawn";
    case "assessment_center_completed":
      return "Completed";
    case "assessment_center_sent_for_result_encoding":
      return "Moved to Result Encoding";
    case "assessment_center_passed":
      return "Passed";
    case "assessment_center_not_passed":
      return "Failed";
    case "assessment_center_rejected":
      return "Rejected";
    case "assessment_center_cancelled":
      return "Cancelled";
    default:
      return event.to_status ? getApplicationSubmissionStatusLabel(event.to_status) : "Updated";
  }
}

export function getWorkflowEventDescription(event: SubmissionHistoryEntry) {
  if (event.reason) {
    return event.reason;
  }

  switch (event.event_type) {
    case "applicant_submitted":
      return "The applicant submitted this form directly to TESDA.";
    case "applicant_submitted_to_teacher":
      return "The applicant submitted this room-based form to the teacher queue.";
    case "applicant_resubmitted":
      return "The applicant edited the submission and sent it back through the same route.";
    case "admin_requested_applicant_update":
      return "TESDA returned this submission to the applicant for correction before further processing.";
    case "admin_rescheduled_assessment":
      return "TESDA updated the assigned assessment date or assessor.";
    case "teacher_forwarded_to_admin":
      return "The teacher reviewed the room batch and forwarded it to TESDA.";
    case "admin_assigned_to_center":
      return "TESDA routed this submission to an assessment center.";
    case "admin_returned_to_queue":
      return "TESDA removed the center assignment and returned the submission to the main queue.";
    case "applicant_withdrew":
      return "The applicant withdrew the submission before final center processing.";
    case "assessment_center_completed":
      return "The assessment center recorded a completed outcome.";
    case "assessment_center_sent_for_result_encoding":
      return "The assessment center finished reviewing the PDF and moved this submission to result encoding.";
    case "assessment_center_passed":
      return "The assessment center recorded a passed outcome.";
    case "assessment_center_not_passed":
      return "The assessment center recorded a not-passed outcome.";
    case "assessment_center_rejected":
      return "The assessment center recorded a rejected outcome.";
    case "assessment_center_cancelled":
      return "The assessment center recorded a cancelled outcome.";
    default:
      return event.to_status ? `Status updated to ${getApplicationSubmissionStatusLabel(event.to_status)}.` : "Workflow updated.";
  }
}

export function formatWorkflowActor(actorEmail: string | null, actorRole: string | null) {
  if (!actorEmail && !actorRole) {
    return "System";
  }

  if (!actorEmail) {
    return actorRole ?? "System";
  }

  if (!actorRole) {
    return actorEmail;
  }

  return `${actorEmail} (${actorRole.replace(/_/g, " ")})`;
}

export async function loadApplicationSubmissionReportRows() {
  const supabase = createSupabaseAdminClient();
  const [{ data: submissions, error: submissionsError }, { data: assignments, error: assignmentsError }, { data: rooms, error: roomsError }, { data: centers, error: centersError }] =
    await Promise.all([
      supabase
        .from("applicant_application_submissions")
        .select(
          "id, applicant_name, applicant_email, qualification_title, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status, latest_status_reason, latest_status_updated_at",
        )
        .order("submitted_at", { ascending: false }),
      supabase
        .from("assessment_center_applicants")
        .select(
          "applicant_reference, assigned_at, assessment_center_id, assessment_date, assessor, assignment_group_key, assignment_group_number",
        ),
      supabase.from("rooms").select("id, name"),
      supabase.from("assessment_centers").select("id, name"),
    ]);

  if (submissionsError || assignmentsError || roomsError || centersError) {
    throw new Error("Unable to load the application submission report.");
  }

  const centerNameById = new Map((centers ?? []).map((center) => [center.id, center.name]));
  const roomNameById = new Map((rooms ?? []).map((room) => [room.id, room.name]));
  const assignmentBySubmissionId = new Map(
    (assignments ?? []).map((assignment) => [
      assignment.applicant_reference,
      {
        assigned_at: assignment.assigned_at,
        assessment_date: assignment.assessment_date ?? null,
        assessment_center_name: centerNameById.get(assignment.assessment_center_id) ?? null,
        assessor: assignment.assessor ?? null,
        assignment_group_key: assignment.assignment_group_key ?? null,
        assignment_group_number: assignment.assignment_group_number ?? null,
      },
    ]),
  );

  return (submissions ?? []).map(
    (submission) =>
      ({
        applicant_email: submission.applicant_email,
        applicant_name: submission.applicant_name,
        assigned_at: assignmentBySubmissionId.get(submission.id)?.assigned_at ?? null,
        assessment_date: assignmentBySubmissionId.get(submission.id)?.assessment_date ?? null,
        assessment_center_name: assignmentBySubmissionId.get(submission.id)?.assessment_center_name ?? null,
        assessor: assignmentBySubmissionId.get(submission.id)?.assessor ?? null,
        assignment_group_key: assignmentBySubmissionId.get(submission.id)?.assignment_group_key ?? null,
        assignment_group_number: assignmentBySubmissionId.get(submission.id)?.assignment_group_number ?? null,
        id: submission.id,
        latest_status_reason: submission.latest_status_reason ?? null,
        latest_status_updated_at: submission.latest_status_updated_at ?? null,
        qualification_title: submission.qualification_title,
        room_name: submission.room_id ? roomNameById.get(submission.room_id) ?? null : null,
        submission_source: submission.submission_source,
        submitted_at: submission.submitted_at,
        teacher_forwarded_at: submission.teacher_forwarded_at ?? null,
        workflow_status: submission.workflow_status,
      }) satisfies SubmissionReportRow,
  );
}

export async function buildApplicationSubmissionReportCsv() {
  const rows = await loadApplicationSubmissionReportRows();
  const header = [
    "Submission ID",
    "Applicant Name",
    "Applicant Email",
    "Qualification",
    "Source",
    "Room Name",
    "Submitted At",
    "Teacher Forwarded At",
    "Assigned At",
    "Assessment Date",
    "Assessment Center",
    "Assessor",
    "Assignment Group",
    "Workflow Status",
    "Latest Status Label",
    "Latest Status Reason",
    "Latest Status Updated At",
  ];

  const lines = rows.map((row) =>
    [
      row.id,
      row.applicant_name,
      row.applicant_email,
      row.qualification_title,
      row.submission_source,
      row.room_name,
      row.submitted_at,
      row.teacher_forwarded_at,
      row.assigned_at,
      row.assessment_date ? formatAssessmentDate(row.assessment_date) : null,
      row.assessment_center_name,
      row.assessor,
      row.assignment_group_number ? `Batch ${row.assignment_group_number}` : null,
      row.workflow_status,
      getApplicationSubmissionStatusLabel(row.workflow_status),
      row.latest_status_reason,
      row.latest_status_updated_at,
    ]
      .map((value) => escapeCsv(value))
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
