import Link from "next/link";
import { notFound } from "next/navigation";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";
import {
  getSubmissionAssignmentInfoByIds,
  getApplicantSubmissionEditLock,
} from "@/lib/application-submission-lifecycle";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAdminClient } from "@/lib/supabase";

type SubmissionListItem = {
  assigned_at?: string | null;
  applicant_name: string;
  assessment_center_name?: string | null;
  id: string;
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

const terminalStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];
const pillBaseClass = "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-full px-3 text-[11px] font-bold";
const infoPanelClass = "rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-2.5";
const statusUpdatePanelClass = "rounded-[10px] border border-[#dbe6fb] bg-[#f7faff] px-4 py-2.5";
const actionButtonBaseClass =
  "inline-flex min-h-[40px] min-w-[124px] items-center justify-center rounded-lg px-4 text-[12px] font-bold transition";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function renderPill({ className, iconClassName, label }: { className: string; iconClassName?: string; label: string }) {
  return (
    <span className={`${pillBaseClass} ${className}`}>
      {iconClassName ? <i aria-hidden="true" className={`${iconClassName} text-[11px]`} /> : null}
      {label}
    </span>
  );
}

function buildEditHref(submission: SubmissionListItem) {
  if (submission.submission_source === "room" && submission.room_id) {
    return `/applicant/applications/individual?roomId=${submission.room_id}&edit=1&submissionId=${submission.id}`;
  }

  return `/applicant/applications/individual?edit=1&submissionId=${submission.id}`;
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
      nextStep: "No action is needed. This submission now stays here as a record.",
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
    .select("id, applicant_name, qualification_title, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status")
    .eq("applicant_id", currentUser.id)
    .order("submitted_at", { ascending: false });

  const submissionIds = (submissions ?? []).map((submission) => submission.id);
  const roomIds = [...new Set((submissions ?? []).map((submission) => submission.room_id).filter(Boolean))];
  const assignmentMap = await getSubmissionAssignmentInfoByIds(submissionIds);
  const { data: rooms } =
    roomIds.length > 0
      ? await supabase.from("rooms").select("id, name").in("id", roomIds)
      : { data: [] as Array<{ id: string; name: string }> };

  const roomMap = new Map((rooms ?? []).map((room) => [room.id, room.name]));
  const normalizedSubmissions: SubmissionListItem[] = (submissions ?? []).map((submission) => ({
    ...submission,
    assigned_at: assignmentMap.get(submission.id)?.assigned_at ?? null,
    assessment_center_name: assignmentMap.get(submission.id)?.assessment_center_name ?? null,
    room_name: submission.room_id ? roomMap.get(submission.room_id) ?? null : null,
  }));
  const submissionCards = normalizedSubmissions.map((submission) => {
    const editLock = getApplicantSubmissionEditLock({
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

    return {
      assessmentBadge: getAssessmentCenterBadge(submission),
      editLock,
      sourceBadge: getSourceBadge(submission),
      statusDetails: getSubmissionStatusDetails(submission),
      statusBadge: getStatusBadge(submission),
      submission,
    };
  });
  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content-narrow">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Submitted Forms</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Open your submitted forms, download PDFs, and track their progress.
          </p>
        </section>

        {normalizedSubmissions.length === 0 ? (
          <section className="rounded-[12px] border border-[#d9e3f7] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f8ff_100%)] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
              <i aria-hidden="true" className="fa-solid fa-file-circle-plus text-[18px]" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-[#0b1c30]">No submitted forms yet</p>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#747685]">
              Once you submit an individual or room-based application, the official PDF softcopy will appear here.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
                href="/applicant/applications/individual"
              >
                Start Individual Form
              </Link>
              <Link
                className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-5 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/applicant/room"
              >
                Join a Room
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-2.5">
            {submissionCards.map(
              ({ assessmentBadge, editLock, sourceBadge, statusBadge, statusDetails, submission }) => {
                const showStatusBadge =
                  submission.workflow_status !== "assigned" &&
                  submission.workflow_status !== "under_review" &&
                  submission.workflow_status !== "submitted_to_admin";

                return (
                  <article
                    key={submission.id}
                    className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] sm:p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {renderPill(sourceBadge)}
                            {showStatusBadge ? renderPill(statusBadge) : null}
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[20px] font-bold leading-[1.2] text-[#0b1c30]">{submission.qualification_title}</p>
                            <p className="text-[13px] leading-[1.55] text-[#444653]">
                              Submitted under <span className="font-semibold text-[#0b1c30]">{submission.applicant_name}</span>.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 xl:max-w-[420px] xl:justify-end">
                          {renderPill(assessmentBadge)}
                          {renderPill({
                            className: editLock.isLocked
                              ? "border border-[#d6dce9] bg-[#f7f9fc] text-[#7a879d]"
                              : "border border-[#d4def2] bg-[#f8fbff] text-[#3056c4]",
                            label: editLock.isLocked ? "Editing Locked" : "Editable",
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <div className={infoPanelClass}>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Submitted</p>
                          <p className="mt-1.5 text-[13px] font-semibold leading-[1.45] text-[#0b1c30]">
                            {formatDateTime(submission.submitted_at)}
                          </p>
                        </div>
                        <div className={infoPanelClass}>
                          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Current Status</p>
                          <p className="mt-1.5 text-[13px] font-semibold leading-[1.45] text-[#0b1c30]">
                            {statusDetails.currentStatus}
                          </p>
                        </div>
                      </div>

                      <div className={statusUpdatePanelClass}>
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#3056c4] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                            <i aria-hidden="true" className="fa-solid fa-circle-info text-[13px]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Update</p>
                            <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#0b1c30]">
                              {statusDetails.updateSummary}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-[1.55] text-[#30435f]">{statusDetails.nextStep}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {editLock.isLocked ? (
                          <span className={`${actionButtonBaseClass} border border-[#d6dce9] bg-[#f7f9fc] text-[#7a879d]`}>
                            Editing Locked
                          </span>
                        ) : (
                          <Link
                            className={`${actionButtonBaseClass} border border-[#c4d1eb] bg-[#f8fbff] text-[#002576] hover:bg-[#eff4ff]`}
                            href={buildEditHref(submission)}
                          >
                            Edit Form
                          </Link>
                        )}
                        <a
                          className={`${actionButtonBaseClass} border border-[#c4d1eb] bg-white text-[#002576] hover:bg-[#eff4ff]`}
                          href={buildApplicationSubmissionPdfUrl(submission.id)}
                          rel="noreferrer"
                          target="_blank"
                        >
                          View PDF
                        </a>
                        <a
                          className={`${actionButtonBaseClass} bg-[#002576] text-white hover:bg-[#0038a8]`}
                          href={buildApplicationSubmissionPdfUrl(submission.id, { download: true })}
                        >
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}
