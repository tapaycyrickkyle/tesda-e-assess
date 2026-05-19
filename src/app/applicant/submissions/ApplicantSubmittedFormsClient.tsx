"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import NotificationModal from "@/components/notifications/NotificationModal";
import NotificationToast from "@/components/notifications/NotificationToast";

type SubmissionCard = {
  assessmentBadge: {
    className: string;
    iconClassName?: string;
    label: string;
  };
  editLock: {
    isLocked: boolean;
    message: string | null;
  };
  sourceBadge: {
    className: string;
    iconClassName?: string;
    label: string;
  };
  statusBadge: {
    className: string;
    iconClassName?: string;
    label: string;
  };
  statusDetails: {
    currentStatus: string;
    nextStep: string;
    updateSummary: string;
  };
  submission: {
    id: string;
    applicant_name: string;
    qualification_title: string;
    room_id: string | null;
    room_name?: string | null;
    submission_source: "individual" | "room";
    submitted_at: string;
    workflow_status:
      | "draft"
      | "submitted_to_teacher"
      | "submitted_to_admin"
      | "assigned"
      | "under_review"
      | "completed"
      | "rejected"
      | "cancelled"
      | "withdrawn";
  };
  timeline: Array<{
    actor: string;
    description: string;
    id: string;
    label: string;
    recordedAt: string;
  }>;
  withdrawLock: {
    isLocked: boolean;
    message: string | null;
  };
};

const actionButtonBaseClass =
  "inline-flex min-h-[40px] min-w-[124px] items-center justify-center rounded-lg px-4 text-[12px] font-bold transition";
const pillBaseClass = "inline-flex min-h-[36px] items-center justify-center gap-2 rounded-full px-3 text-[11px] font-bold";
const infoPanelClass = "rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-2.5";
const statusUpdatePanelClass = "rounded-lg border border-[#dbe6fb] bg-[#f7faff] px-4 py-2.5";

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

function buildEditHref(submission: SubmissionCard["submission"]) {
  if (submission.submission_source === "room" && submission.room_id) {
    return `/applicant/apply/individual?roomId=${submission.room_id}&edit=1&submissionId=${submission.id}`;
  }

  return `/applicant/apply/individual?edit=1&submissionId=${submission.id}`;
}

function buildApplicationSubmissionPdfUrl(submissionId: string, options?: { download?: boolean }) {
  const baseUrl = `/api/application-submissions/${submissionId}/pdf`;
  return options?.download ? `${baseUrl}?download=1` : baseUrl;
}

function buildWithdrawnCard(card: SubmissionCard): SubmissionCard {
  return {
    ...card,
    editLock: {
      isLocked: true,
      message: "This submission is already withdrawn and can no longer be edited.",
    },
    statusBadge: {
      className: "border border-[#f2d1d1] bg-[#fff8f8] text-[#b42318]",
      iconClassName: "fa-solid fa-ban",
      label: "Withdrawn",
    },
    statusDetails: {
      currentStatus: "Withdrawn",
      nextStep: "No action is needed. This submission now stays here as a record.",
      updateSummary: "Current record: Withdrawn",
    },
    submission: {
      ...card.submission,
      workflow_status: "withdrawn",
    },
    withdrawLock: {
      isLocked: true,
      message: "This submission is already withdrawn and can no longer be withdrawn.",
    },
  };
}

export default function ApplicantSubmittedFormsClient({ submissionCards }: { submissionCards: SubmissionCard[] }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionCard["submission"] | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [withdrawnSubmissionIds, setWithdrawnSubmissionIds] = useState<string[]>([]);
  const [withdrawReason, setWithdrawReason] = useState("");

  const renderedCards = submissionCards.map((card) =>
    withdrawnSubmissionIds.includes(card.submission.id) ? buildWithdrawnCard(card) : card,
  );

  const handleWithdraw = async () => {
    if (!selectedSubmission) {
      return;
    }

    setIsWithdrawing(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/applicant/application-submissions", {
        body: JSON.stringify({
          action: "withdraw",
          reason: withdrawReason,
          submissionId: selectedSubmission.id,
        }),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      const payload = (await response.json()) as { message?: string; success?: boolean };

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to withdraw the application.");
      }

      setSuccessMessage(payload.message ?? "Application withdrawn successfully.");
      setSelectedSubmission(null);
      setWithdrawReason("");
      setWithdrawnSubmissionIds((currentIds) =>
        currentIds.includes(selectedSubmission.id) ? currentIds : [...currentIds, selectedSubmission.id],
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to withdraw the application.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <>
      {renderedCards.length === 0 ? (
        <section className="rounded-xl border border-[#d9e3f7] bg-[linear-gradient(180deg,#fbfdff_0%,#f5f8ff_100%)] px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
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
              href="/applicant/apply/individual"
            >
              Start Individual Form
            </Link>
            <Link
              className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-5 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
              href="/applicant/rooms"
            >
              Join a Room
            </Link>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-2.5">
          {renderedCards.map(({ assessmentBadge, editLock, sourceBadge, statusBadge, statusDetails, submission, timeline, withdrawLock }) => {
            const showStatusBadge =
              submission.workflow_status !== "assigned" &&
              submission.workflow_status !== "under_review" &&
              submission.workflow_status !== "submitted_to_admin";

            return (
              <article
                key={submission.id}
                className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:bg-[#fcfdff] hover:shadow-[0_10px_20px_rgba(15,23,42,0.06)] sm:p-4"
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

                  <div className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Timeline</p>
                      <span className="text-[11px] font-semibold text-[#747685]">Latest first</span>
                    </div>
                    <div className="mt-3 space-y-3">
                      {timeline.length > 0 ? (
                        timeline.slice(0, 4).map((entry) => (
                          <div key={entry.id} className="border-l-2 border-[#d9e3f7] pl-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-[13px] font-semibold text-[#0b1c30]">{entry.label}</p>
                              <p className="text-[11px] font-semibold text-[#747685]">{formatDateTime(entry.recordedAt)}</p>
                            </div>
                            <p className="mt-1 text-[12px] leading-[1.55] text-[#30435f]">{entry.description}</p>
                            <p className="mt-1 text-[11px] font-medium text-[#747685]">By {entry.actor}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-md border border-[#d9e3f7] bg-white px-3.5 py-3">
                          <p className="text-[12px] leading-[1.55] text-[#747685]">
                            Timeline history will appear here once this submission moves through the workflow.
                          </p>
                        </div>
                      )}
                      {timeline.length > 4 ? (
                        <p className="text-[11px] font-medium text-[#747685]">
                          Showing the 4 most recent events out of {timeline.length}.
                        </p>
                      ) : null}
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
                    {!withdrawLock.isLocked ? (
                      <button
                        className={`${actionButtonBaseClass} border border-[#efc5c5] bg-[#fff4f4] text-[#93000a] hover:bg-[#ffeaea]`}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setWithdrawReason("");
                        }}
                        type="button"
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <NotificationModal
        actions={
          <div className="flex flex-col gap-3">
            <label className="text-left">
              <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Reason (Optional)</span>
              <textarea
                className="mt-2 min-h-[96px] w-full rounded-lg border border-[#d9e3f7] bg-white px-3 py-2.5 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                onChange={(event) => setWithdrawReason(event.target.value)}
                placeholder="Add a short note about why you are withdrawing this application."
                value={withdrawReason}
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                className="inline-flex min-h-[40px] min-w-[112px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                disabled={isWithdrawing}
                onClick={() => {
                  setSelectedSubmission(null);
                  setWithdrawReason("");
                }}
                type="button"
              >
                Keep Application
              </button>
              <button
                className="inline-flex min-h-[40px] min-w-[132px] items-center justify-center rounded-lg bg-[#b42318] px-4 text-[13px] font-bold text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isWithdrawing}
                onClick={() => void handleWithdraw()}
                type="button"
              >
                {isWithdrawing ? "Withdrawing..." : "Withdraw Now"}
              </button>
            </div>
          </div>
        }
        description={
          selectedSubmission?.submission_source === "room"
            ? "This room-based application will stop moving through teacher or TESDA processing and remain visible here as a withdrawn record."
            : "This application will stop moving through TESDA processing and remain visible here as a withdrawn record."
        }
        message={
          selectedSubmission
            ? `Withdraw your ${selectedSubmission.qualification_title} application?`
            : ""
        }
        onClose={() => {
          setSelectedSubmission(null);
          setWithdrawReason("");
        }}
        open={Boolean(selectedSubmission)}
        title="Confirm Withdrawal"
        variant="warning"
      />

      <NotificationToast
        message={errorMessage}
        onClose={() => setErrorMessage("")}
        open={Boolean(errorMessage)}
        title="Withdrawal Failed"
        variant="error"
      />

      <NotificationToast
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        open={Boolean(successMessage)}
        title="Application Withdrawn"
        variant="success"
      />
    </>
  );
}
