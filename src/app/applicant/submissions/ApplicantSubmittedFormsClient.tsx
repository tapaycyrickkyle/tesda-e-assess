"use client";

import AnimatedModal from "@/components/AnimatedModal";
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
      | "needs_applicant_update"
      | "assigned"
      | "under_review"
      | "for_result_encoding"
      | "passed"
      | "not_passed"
      | "completed"
      | "rejected"
      | "cancelled"
      | "withdrawn";
  };
  withdrawLock: {
    isLocked: boolean;
    message: string | null;
  };
};

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

function splitCorrectionNote(message: string) {
  const marker = "\n\nCorrection note:";

  if (!message.includes(marker)) {
    return {
      correctionNote: null,
      summary: message,
    };
  }

  const [summary, note] = message.split(marker);

  return {
    correctionNote: note?.trim() ?? null,
    summary: summary.trim(),
  };
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
  const [selectedDetailsSubmissionId, setSelectedDetailsSubmissionId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionCard["submission"] | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [withdrawnSubmissionIds, setWithdrawnSubmissionIds] = useState<string[]>([]);
  const [withdrawReason, setWithdrawReason] = useState("");

  const renderedCards = submissionCards.map((card) =>
    withdrawnSubmissionIds.includes(card.submission.id) ? buildWithdrawnCard(card) : card,
  );
  const selectedDetailsCard = renderedCards.find((card) => card.submission.id === selectedDetailsSubmissionId) ?? null;
  const correctionMessageParts = selectedDetailsCard
    ? splitCorrectionNote(selectedDetailsCard.statusDetails.nextStep)
    : null;

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
        <section className="rounded-xl border border-[#d9e3f7] bg-white px-4 py-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
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
          {renderedCards.map(({ statusDetails, submission }) => {
            return (
              <article
                key={submission.id}
                className="rounded-xl border border-[#d9e3f7] bg-[linear-gradient(180deg,#ffffff_0%,#fcfdff_100%)] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition"
              >
                <div className="px-4 py-3.5 sm:px-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[18px] font-bold leading-[1.25] text-[#0b1c30]">{submission.qualification_title}</p>
                        <p className="text-[13px] leading-[1.55] text-[#444653]">
                          Submitted on <span className="font-semibold text-[#0b1c30]">{formatDateTime(submission.submitted_at)}</span>
                        </p>
                        <p className="text-[13px] leading-[1.55] text-[#444653]">
                          Current status: <span className="font-semibold text-[#0b1c30]">{statusDetails.currentStatus}</span>
                        </p>
                      </div>
                      <button
                        aria-haspopup="dialog"
                        className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg border border-[#c4d1eb] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        onClick={() => setSelectedDetailsSubmissionId(submission.id)}
                        type="button"
                      >
                        <span>View Details</span>
                        <i aria-hidden="true" className="fa-solid fa-chevron-right text-[11px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <AnimatedModal
        contentClassName="max-h-[calc(100vh-32px)] w-full max-w-[720px] overflow-y-auto rounded-xl border border-[#d9e3f7] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(selectedDetailsCard)}
      >
        {selectedDetailsCard ? (
          <div>
            <div className="flex items-start justify-between gap-4 border-b border-[#e6edf9] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="text-[22px] font-bold leading-[1.2] text-[#0b1c30]">
                  {selectedDetailsCard.submission.qualification_title}
                </h2>
                <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                  Submitted under{" "}
                  <span className="font-semibold text-[#0b1c30]">{selectedDetailsCard.submission.applicant_name}</span>.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => setSelectedDetailsSubmissionId(null)}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <div className="px-5 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Submitted</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {formatDateTime(selectedDetailsCard.submission.submitted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Current Status</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {selectedDetailsCard.statusDetails.currentStatus}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Submission Type</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {selectedDetailsCard.sourceBadge.label}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Assessment Center</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {selectedDetailsCard.assessmentBadge.label}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Edit Availability</p>
                  <p className="mt-1 text-[14px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {selectedDetailsCard.editLock.isLocked ? "Editing Locked" : "Editable"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-3 border-t border-[#eef3fb] pt-4">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#3056c4]">
                  <i aria-hidden="true" className="fa-solid fa-circle-info text-[13px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Update</p>
                  <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-[#0b1c30]">
                    {selectedDetailsCard.statusDetails.updateSummary}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-[1.55] text-[#30435f]">
                    {correctionMessageParts?.summary ?? selectedDetailsCard.statusDetails.nextStep}
                  </p>
                  {correctionMessageParts?.correctionNote ? (
                    <div className="mt-3 rounded-lg border border-[#f1d8bf] bg-[#fff8e8] px-3.5 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#8a5200]">
                        Correction Note
                      </p>
                      <p className="mt-1.5 text-[13px] leading-[1.55] text-[#6b4a16]">
                        {correctionMessageParts.correctionNote}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 border-t border-[#eef3fb] pt-4 sm:flex-row sm:flex-wrap sm:justify-end">
                {selectedDetailsCard.editLock.isLocked ? (
                  <span className={`${actionButtonBaseClass} border border-[#d6dce9] bg-[#f7f9fc] text-[#7a879d]`}>
                    Editing Locked
                  </span>
                ) : (
                  <Link
                    className={`${actionButtonBaseClass} border border-[#c4d1eb] bg-[#f8fbff] text-[#002576] hover:bg-[#eff4ff]`}
                    href={buildEditHref(selectedDetailsCard.submission)}
                  >
                    Edit Form
                  </Link>
                )}
                <a
                  className={`${actionButtonBaseClass} border border-[#c4d1eb] bg-white text-[#002576] hover:bg-[#eff4ff]`}
                  href={buildApplicationSubmissionPdfUrl(selectedDetailsCard.submission.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  View PDF
                </a>
                <a
                  className={`${actionButtonBaseClass} bg-[#002576] text-white hover:bg-[#0038a8]`}
                  href={buildApplicationSubmissionPdfUrl(selectedDetailsCard.submission.id, { download: true })}
                >
                  Download PDF
                </a>
                {!selectedDetailsCard.withdrawLock.isLocked ? (
                  <button
                    className={`${actionButtonBaseClass} border border-[#efc5c5] bg-[#fff4f4] text-[#93000a] hover:bg-[#ffeaea]`}
                    onClick={() => {
                      setSelectedDetailsSubmissionId(null);
                      setSelectedSubmission(selectedDetailsCard.submission);
                      setWithdrawReason("");
                    }}
                    type="button"
                  >
                    Withdraw
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </AnimatedModal>

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
