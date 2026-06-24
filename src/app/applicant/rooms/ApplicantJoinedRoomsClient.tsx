"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationToast from "@/components/notifications/NotificationToast";
import type { ApplicationSubmissionStatus } from "@/lib/application-form";

type JoinedRoomCard = {
  assessmentCenterName: string | null;
  joinedAt: string;
  joinCode: string;
  membershipId: string;
  qualification: string;
  roomId: string;
  roomName: string;
  submissionStatus: ApplicationSubmissionStatus | null;
};

type LeaveRoomResponse = {
  membershipId?: string;
  message?: string;
  success?: boolean;
};

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getRoomSubmissionStatusLabel(status?: ApplicationSubmissionStatus | null, assessmentCenterName?: string | null) {
  if (status === "assigned" || status === "under_review") {
    return assessmentCenterName ? `Under review at ${assessmentCenterName}` : "Under Review at Assessment Center";
  }

  if (status === "completed") {
    return "COC";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  if (status === "cancelled") {
    return "Cancelled";
  }

  if (status === "withdrawn") {
    return "Withdrawn";
  }

  if (status === "submitted_to_admin") {
    return "Submitted to TESDA";
  }

  if (status === "needs_applicant_update") {
    return "Needs Applicant Update";
  }

  if (status === "submitted_to_teacher") {
    return "Submitted to Teacher";
  }

  return "Pending Submission";
}

function getRoomSubmissionStatusBadgeClass(status?: ApplicationSubmissionStatus | null) {
  if (status === "assigned" || status === "under_review") {
    return "bg-[#e8f2ff] text-[#0038a8]";
  }

  if (status === "completed") {
    return "bg-[#e8f7ee] text-[#166534]";
  }

  if (status === "rejected" || status === "cancelled" || status === "withdrawn") {
    return "bg-[#fff1f1] text-[#b42318]";
  }

  if (status === "submitted_to_admin") {
    return "bg-[#e8f2ff] text-[#0038a8]";
  }

  if (status === "needs_applicant_update") {
    return "bg-[#fff8e8] text-[#8a5200]";
  }

  if (status === "submitted_to_teacher") {
    return "bg-[#eefaf1] text-[#1f7a36]";
  }

  return "bg-[#eef3ff] text-[#093cab]";
}

function isAssessmentCenterReviewStatus(status?: ApplicationSubmissionStatus | null) {
  return status === "assigned" || status === "under_review";
}

function getRoomSubmissionGuidance(status?: ApplicationSubmissionStatus | null, assessmentCenterName?: string | null) {
  if (status === "assigned" || status === "under_review") {
    return assessmentCenterName
      ? `${assessmentCenterName} is now reviewing your submission. Wait for the center to finish the assessment process.`
      : "The assigned assessment center is now reviewing your submission. Wait for the center to finish the assessment process.";
  }

  if (status === "completed" || status === "rejected" || status === "cancelled" || status === "withdrawn") {
    return "This room submission is already finalized and stays available here as a record.";
  }

  if (status === "submitted_to_admin") {
    return "TESDA has received this room submission and will assign an assessment center next.";
  }

  if (status === "needs_applicant_update") {
    return "TESDA returned this room submission for correction. Update the form and resubmit it to continue processing.";
  }

  if (status === "submitted_to_teacher") {
    return "Your teacher still needs to review and forward this room submission to TESDA.";
  }

  return "You joined this room successfully. Start your application form when you are ready, or leave the room before submitting.";
}

function getRoomActionLabel(status?: ApplicationSubmissionStatus | null) {
  if (!status) {
    return "Start Application";
  }

  if (status === "submitted_to_teacher") {
    return "Continue Application";
  }

  if (status === "needs_applicant_update") {
    return "Update Submission";
  }

  return "Open Submission";
}

export default function ApplicantJoinedRoomsClient({
  initialError,
  initialRooms,
}: {
  initialError: string;
  initialRooms: JoinedRoomCard[];
}) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(initialError);
  const [isLeavingRoom, setIsLeavingRoom] = useState(false);
  const [pendingRoomExit, setPendingRoomExit] = useState<JoinedRoomCard | null>(null);
  const [rooms, setRooms] = useState(initialRooms);
  const [successMessage, setSuccessMessage] = useState("");
  const visibleRooms = useMemo(() => rooms, [rooms]);

  async function handleLeaveRoom() {
    if (!pendingRoomExit) {
      return;
    }

    setIsLeavingRoom(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/applicant/rooms/${pendingRoomExit.membershipId}`, {
        credentials: "same-origin",
        method: "DELETE",
      });

      const payload = (await response.json()) as LeaveRoomResponse;

      if (!response.ok || !payload.success || !payload.membershipId) {
        throw new Error(payload.message ?? "Unable to leave this room right now.");
      }

      setRooms((currentRooms) => currentRooms.filter((room) => room.membershipId !== payload.membershipId));
      setSuccessMessage(payload.message ?? "You left the room successfully.");
      setPendingRoomExit(null);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to leave this room right now.");
    } finally {
      setIsLeavingRoom(false);
    }
  }

  return (
    <main className="ui-portal-main pb-8 pt-6">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Joined Assessment Rooms</h1>
          <p className="ui-page-description">
            Review the rooms you have joined and the status of each application.
          </p>
        </section>

        {errorMessage ? (
          <NotificationBanner className="mb-5" message={errorMessage} variant="error" />
        ) : null}

        {!errorMessage && visibleRooms.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#d9e3f7] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
              <i aria-hidden="true" className="fa-solid fa-right-to-bracket text-[18px]" />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold text-[#0b1c30]">No joined rooms yet</h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#444653]">
              Go to Applications and use the Join Assessment Room option with a teacher-provided room code.
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-[#002576] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/applicant/apply"
            >
              Go to Applications
            </Link>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {visibleRooms.map((room) => {
            const canLeaveRoom = !room.submissionStatus;

            return (
              <article
                key={room.membershipId}
                className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-xl border border-[#d9e3f7] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-[#002576]" />

                <div className="mb-4 flex flex-col items-center text-center">
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
                    <i aria-hidden="true" className="fa-solid fa-door-open text-[14px]" />
                  </div>
                  <div className="w-full">
                    <h2 className="mx-auto max-w-[220px] text-[17px] font-bold leading-[1.25] text-[#24364c]">{room.roomName}</h2>
                    <div className="mt-2.5 flex min-h-[50px] items-start justify-center">
                      <span className="mx-auto inline-flex max-w-full items-center justify-center rounded-full bg-[#eef3ff] px-3 py-1 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4]">
                        {room.qualification}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] p-3">
                  <div className="flex items-center justify-between gap-3 border-b border-[#d9e3f7] pb-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                      <i aria-hidden="true" className="fa-solid fa-hashtag text-[14px] text-[#5d5f5f]" />
                      Room Code
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 font-mono text-[13px] font-bold tracking-[0.14em] text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                      {room.joinCode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                      <i aria-hidden="true" className="fa-regular fa-clock text-[14px] text-[#5d5f5f]" />
                      Joined
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#24364c]">
                      {formatJoinedAt(room.joinedAt)}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-[#d9e3f7] pt-2.5">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                      <i aria-hidden="true" className="fa-regular fa-file-lines text-[14px] text-[#5d5f5f]" />
                      Status
                    </span>
                    {isAssessmentCenterReviewStatus(room.submissionStatus) ? (
                      <span className="text-right text-[13px] font-bold text-[#0038a8]">
                        {getRoomSubmissionStatusLabel(room.submissionStatus, room.assessmentCenterName)}
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-3 py-1 text-[13px] font-bold ${getRoomSubmissionStatusBadgeClass(room.submissionStatus)}`}
                      >
                        {getRoomSubmissionStatusLabel(room.submissionStatus, room.assessmentCenterName)}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 border-t border-[#d9e3f7] pt-2.5">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">Next Step</p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                      {getRoomSubmissionGuidance(room.submissionStatus, room.assessmentCenterName)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#002576]"
                    href={`/applicant/apply/individual?roomId=${room.roomId}`}
                  >
                    <span>{getRoomActionLabel(room.submissionStatus)}</span>
                    <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
                  </Link>
                  {canLeaveRoom ? (
                    <button
                      className="inline-flex items-center justify-center rounded-lg border border-[#efc5c5] bg-[#fff4f4] px-4 py-2.5 text-[13px] font-bold text-[#93000a] transition hover:bg-[#ffeaea]"
                      onClick={() => setPendingRoomExit(room)}
                      type="button"
                    >
                      Leave Room
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <AnimatedModal
        contentClassName="w-full max-w-[440px] rounded-xl border border-[#d9e3f7] bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(pendingRoomExit)}
      >
        {pendingRoomExit ? (
          <>
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4f4] text-[#b42318]">
                <i aria-hidden="true" className="fa-solid fa-right-from-bracket text-[18px]" />
              </div>
              <div className="mt-4">
                <h2 className="text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">Leave Room?</h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
                  You will leave <span className="font-bold">{pendingRoomExit.roomName}</span> and lose access to its room application until you join again with the room code.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-4 py-3 text-center">
              <p className="text-[13px] leading-[1.55] text-[#3c4f69]">
                This is only allowed before you submit a room-based application.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                className="inline-flex min-h-[44px] min-w-[100px] items-center justify-center rounded-lg border border-[#c4c5d5] px-4 text-[14px] font-bold text-[#444653] transition hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLeavingRoom}
                onClick={() => setPendingRoomExit(null)}
                type="button"
              >
                Stay Joined
              </button>
              <button
                className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-lg bg-[#b42318] px-4 text-[14px] font-bold text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isLeavingRoom}
                onClick={() => void handleLeaveRoom()}
                type="button"
              >
                {isLeavingRoom ? "Leaving..." : "Yes, Leave Room"}
              </button>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <NotificationToast
        message={successMessage}
        onClose={() => setSuccessMessage("")}
        open={Boolean(successMessage)}
        title="Room Left"
        variant="success"
      />
    </main>
  );
}
