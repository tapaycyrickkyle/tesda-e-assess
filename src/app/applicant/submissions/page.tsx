import { notFound } from "next/navigation";
import ApplicantSubmittedFormsClient from "@/app/applicant/submissions/ApplicantSubmittedFormsClient";
import {
  getSubmissionAssignmentInfoByIds,
  getApplicantSubmissionEditLock,
  getApplicantSubmissionWithdrawalLock,
} from "@/lib/application-submission-lifecycle";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  getWorkflowEventDescription,
  getWorkflowEventLabel,
  loadSubmissionHistoryByIds,
} from "@/lib/workflow-history";

type SubmissionListItem = {
  assigned_at?: string | null;
  applicant_name: string;
  assessment_center_name?: string | null;
  id: string;
  latest_status_reason?: string | null;
  qualification_title: string;
  room_id: string | null;
  room_name?: string | null;
  submission_source: "individual" | "room";
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: ApplicationSubmissionStatus;
};

type SubmissionStatusDetails = {
  currentStatus: string;
  nextStep: string;
  updateSummary: string;
};

type TimelineEntry = {
  actor: string;
  description: string;
  id: string;
  label: string;
  recordedAt: string;
};

const terminalStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatTimelineActor(actorRole: string | null) {
  switch (actorRole) {
    case "admin":
      return "TESDA";
    case "applicant":
      return "Applicant";
    case "assessment_center":
      return "Assessment Center";
    case "teacher":
      return "Teacher";
    default:
      return "System";
  }
}

function getAssessmentCenterBadge(submission: SubmissionListItem) {
  if (submission.assessment_center_name) {
    return {
      className: "border border-[#cfe0ff] bg-[#eef4ff] text-[#0038a8]",
      iconClassName: "fa-solid fa-building",
      label: submission.assessment_center_name,
    };
  }

  if (submission.assigned_at || submission.workflow_status === "assigned" || submission.workflow_status === "under_review") {
    return {
      className: "border border-[#cfe0ff] bg-[#eef4ff] text-[#0038a8]",
      iconClassName: "fa-solid fa-building",
      label: "Assigned to Center",
    };
  }

  return {
    className: "border border-[#d9e3f7] bg-white text-[#3056c4]",
    iconClassName: "fa-regular fa-clock",
    label: "Not assigned yet",
  };
}

function getStatusBadge(submission: SubmissionListItem) {
  if (submission.workflow_status === "completed") {
    return {
      className: "border border-[#cce9d8] bg-[#edf9f1] text-[#166534]",
      iconClassName: "fa-solid fa-circle-check",
      label: "Completed",
    };
  }

  if (submission.workflow_status === "rejected") {
    return {
      className: "border border-[#f2d1d1] bg-[#fff4f4] text-[#b42318]",
      iconClassName: "fa-solid fa-circle-xmark",
      label: "Rejected",
    };
  }

  if (submission.workflow_status === "cancelled" || submission.workflow_status === "withdrawn") {
    return {
      className: "border border-[#f2d1d1] bg-[#fff8f8] text-[#b42318]",
      iconClassName: "fa-solid fa-ban",
      label: getApplicationSubmissionStatusLabel(submission.workflow_status),
    };
  }

  if (submission.workflow_status === "assigned" || submission.workflow_status === "under_review") {
    return {
      className: "border border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]",
      iconClassName: "fa-solid fa-clipboard-check",
      label: "Under Review",
    };
  }

  if (submission.workflow_status === "submitted_to_admin") {
    return {
      className: "border border-[#d9e3f7] bg-[#eef4ff] text-[#3056c4]",
      iconClassName: "fa-solid fa-paper-plane",
      label: "Submitted to TESDA",
    };
  }

  return {
    className: "border border-[#d4def2] bg-[#f8fbff] text-[#3056c4]",
    iconClassName: "fa-solid fa-file-signature",
    label: "Submitted to Teacher",
  };
}

function getSourceBadge(submission: SubmissionListItem) {
  if (submission.submission_source === "room") {
    return {
      className: "border border-[#d9e3f7] bg-white text-[#3056c4]",
      iconClassName: "fa-solid fa-users-rectangle",
      label: submission.room_name ? `Room | ${submission.room_name}` : "Room application",
    };
  }

  return {
    className: "border border-[#d9e3f7] bg-white text-[#4563a5]",
    iconClassName: "fa-solid fa-user",
    label: "Individual application",
  };
}

function getSubmissionStatusDetails(submission: SubmissionListItem): SubmissionStatusDetails {
  if (submission.workflow_status === "assigned" || submission.workflow_status === "under_review") {
    return {
      currentStatus: submission.assessment_center_name
        ? `Under review at ${submission.assessment_center_name}`
        : "Under review at the assessment center",
      nextStep: submission.assessment_center_name
        ? `Wait for ${submission.assessment_center_name} to finish reviewing your application.`
        : "Wait for the assigned assessment center to finish reviewing your application.",
      updateSummary: submission.assigned_at
        ? `Assessment center review started ${formatDateTime(submission.assigned_at)}`
        : "Assessment center review in progress",
    };
  }

  if (terminalStatuses.includes(submission.workflow_status)) {
    const statusLabel = getApplicationSubmissionStatusLabel(submission.workflow_status);

    return {
      currentStatus: statusLabel,
      nextStep: submission.latest_status_reason
        ? `Recorded reason: ${submission.latest_status_reason}`
        : "No action is needed. This submission now stays here as a record.",
      updateSummary: `Current record: ${statusLabel}`,
    };
  }

  if (submission.workflow_status === "submitted_to_teacher") {
    return {
      currentStatus: "Submitted to Teacher",
      nextStep: "Wait for your teacher to review and forward this room submission to TESDA.",
      updateSummary: `Submitted to Teacher ${formatDateTime(submission.submitted_at)}`,
    };
  }

  return {
    currentStatus: "Submitted to TESDA",
    nextStep:
      submission.submission_source === "room"
        ? "TESDA will assign an assessment center next. Editing is now locked for this room submission."
        : "Wait for TESDA to assign an assessment center. You can still edit until assignment.",
    updateSummary: submission.teacher_forwarded_at
      ? `Forwarded to TESDA ${formatDateTime(submission.teacher_forwarded_at)}`
      : `Submitted to TESDA ${formatDateTime(submission.submitted_at)}`,
  };
}

export default async function ApplicantSubmittedFormsPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "applicant") {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const { data: submissions } = await supabase
    .from("applicant_application_submissions")
    .select("id, applicant_name, qualification_title, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status, latest_status_reason")
    .eq("applicant_id", currentUser.id)
    .order("submitted_at", { ascending: false });

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const roomIds = [...new Set((submissions ?? []).map((submission) => submission.room_id).filter(Boolean))];
  const assignmentMap = await getSubmissionAssignmentInfoByIds(submissionIds);
  const historyBySubmissionId = await loadSubmissionHistoryByIds(submissionIds);
  const { data: rooms } =
    roomIds.length > 0
      ? await supabase.from("rooms").select("id, name").in("id", roomIds)
      : { data: [] as Array<{ id: string; name: string }> };
  const { data: roomMemberships } =
    roomIds.length > 0
      ? await supabase
          .from("room_members")
          .select("room_id")
          .eq("applicant_id", currentUser.id)
          .in("room_id", roomIds)
      : { data: [] as Array<{ room_id: string }> };

  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room.name]));
  const joinedRoomIds = new Set((roomMemberships ?? []).map((membership) => membership.room_id));
  const normalizedSubmissions: SubmissionListItem[] = (submissions ?? []).map((submission) => ({
    ...submission,
    assigned_at: assignmentMap.get(submission.id)?.assigned_at ?? null,
    assessment_center_name: assignmentMap.get(submission.id)?.assessment_center_name ?? null,
    room_name: submission.room_id ? roomMap.get(submission.room_id) ?? null : null,
  }));
  const submissionCards = normalizedSubmissions.map((submission) => {
    const baseEditLock = getApplicantSubmissionEditLock({
      assignment: submission.assigned_at
        ? {
            assigned_at: submission.assigned_at,
            assessment_center_id: "",
            assessment_center_name: submission.assessment_center_name ?? null,
          }
        : null,
      submissionSource: submission.submission_source,
      workflowStatus: submission.workflow_status,
    });
    const editLock =
      !baseEditLock.isLocked &&
      submission.submission_source === "room" &&
      submission.room_id &&
      !joinedRoomIds.has(submission.room_id)
        ? {
            isLocked: true,
            message: "You are no longer a member of this room and can no longer edit this room submission.",
          }
        : baseEditLock;

    return {
      assessmentBadge: getAssessmentCenterBadge(submission),
      editLock,
      sourceBadge: getSourceBadge(submission),
      statusDetails: getSubmissionStatusDetails(submission),
      statusBadge: getStatusBadge(submission),
      submission,
      timeline: (historyBySubmissionId.get(submission.id) ?? []).map(
        (entry) =>
          ({
            actor: formatTimelineActor(entry.actor_role),
            description: getWorkflowEventDescription(entry),
            id: entry.id,
            label: getWorkflowEventLabel(entry),
            recordedAt: entry.created_at,
          }) satisfies TimelineEntry,
      ),
      withdrawLock: getApplicantSubmissionWithdrawalLock({
        assignment: submission.assigned_at
          ? {
              assigned_at: submission.assigned_at,
              assessment_center_id: "",
              assessment_center_name: submission.assessment_center_name ?? null,
            }
          : null,
        workflowStatus: submission.workflow_status,
      }),
    };
  });
  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content-narrow">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Submissions</h1>
          <p className="ui-page-description">
            Open your submitted forms, download PDFs, and track their progress.
          </p>
        </section>

        <ApplicantSubmittedFormsClient submissionCards={submissionCards} />
      </div>
    </main>
  );
}
