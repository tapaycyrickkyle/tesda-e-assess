"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import NotificationModal from "@/components/notifications/NotificationModal";
import NotificationToast from "@/components/notifications/NotificationToast";
import { buildApplicationSubmissionPdfUrl } from "@/lib/application-submission-pdf";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getRoomSubmissionStatus, getRoomSubmissionStatusLabel, type RoomRecord } from "@/lib/rooms";

type RoomMember = {
  id: string;
  applicant_id: string;
  applicant_email: string;
  joined_at: string;
};

type RoomApplicationSubmission = {
  applicant_id: string;
  applicant_name: string;
  id: string;
  qualification_title: string;
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: ApplicationSubmissionStatus;
};

type TeacherRoomDetailClientProps = {
  initialApplications: RoomApplicationSubmission[];
  initialMembers: RoomMember[];
  initialRoom: RoomRecord;
};

type UpdateRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
  submittedCount?: number;
};

type DeleteRoomResponse = {
  success: boolean;
  message?: string;
};

type RemoveRoomMemberResponse = {
  success: boolean;
  message?: string;
  removedMemberId?: string;
};

function formatApplicantName(email: string) {
  const localPart = email.split("@")[0] ?? "";

  return localPart
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TeacherRoomDetailClient({
  initialApplications,
  initialMembers,
  initialRoom,
}: TeacherRoomDetailClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [members, setMembers] = useState(initialMembers);
  const [applications, setApplications] = useState(initialApplications);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successModalMessage, setSuccessModalMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<RoomMember | null>(null);
  const joinedApplicantLabel =
    members.length === 1 ? "1 applicant currently joined" : `${members.length} applicants currently joined`;
  const applicationByApplicantId = new Map(applications.map((application) => [application.applicant_id, application]));
  const submittedToTeacherCount = applications.filter((application) => application.workflow_status === "submitted_to_teacher").length;
  const pendingApplicantsCount = members.filter((member) => !applicationByApplicantId.has(member.applicant_id)).length;
  const canSubmitBatch = members.length > 0 && pendingApplicantsCount === 0 && submittedToTeacherCount > 0;
  const roomSubmissionStatus = getRoomSubmissionStatus(
    members.length,
    applications.map((application) => ({
      applicant_id: application.applicant_id,
      workflow_status: application.workflow_status,
    })),
  );

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 4500);

    return () => window.clearTimeout(timeoutId);
  }, [message, errorMessage]);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(room.join_code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setErrorMessage("Unable to copy the room code. Please copy it manually.");
    }
  }

  async function runAction(action: "regenerate_code" | "submit_applications") {
    setIsUpdating(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/teacher/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const payload = (await response.json()) as UpdateRoomResponse;

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Unable to update room.");
        return;
      }

      if (action === "regenerate_code") {
        if (!payload.room) {
          setErrorMessage("Unable to update room.");
          return;
        }

        setRoom(payload.room);
        setMessage(payload.message ?? "Room updated successfully.");
      } else {
        setApplications((currentApplications) =>
          currentApplications.map((application) =>
            application.workflow_status === "submitted_to_teacher"
              ? {
                  ...application,
                  teacher_forwarded_at: new Date().toISOString(),
                  workflow_status: "submitted_to_admin",
                }
              : application,
          ),
        );
        setIsSubmitModalOpen(false);
        setSuccessModalMessage(payload.message ?? "Application submitted to TESDA successfully.");
      }
    } catch {
      setErrorMessage("Unable to update the room right now. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteRoom() {
    setIsUpdating(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/teacher/rooms/${room.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as DeleteRoomResponse;

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.message ?? "Unable to delete room.");
        return;
      }

      setIsDeleteModalOpen(false);
      router.push("/teacher/rooms");
      router.refresh();
    } catch {
      setErrorMessage("Unable to delete the room right now. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleRemoveMember() {
    if (!memberPendingRemoval) {
      return;
    }

    setIsUpdating(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/teacher/rooms/${room.id}`, {
        body: JSON.stringify({
          action: "remove_member",
          memberId: memberPendingRemoval.id,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      const payload = (await response.json()) as RemoveRoomMemberResponse;

      if (!response.ok || !payload.success || !payload.removedMemberId) {
        setErrorMessage(payload.message ?? "Unable to remove the applicant from this room.");
        return;
      }

      setMembers((currentMembers) => currentMembers.filter((member) => member.id !== payload.removedMemberId));
      setMemberPendingRemoval(null);
      setMessage(payload.message ?? "Applicant removed from the room successfully.");
    } catch {
      setErrorMessage("Unable to remove the applicant from this room right now. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="ui-portal-main pb-8 pt-6">
      <div className="ui-page-content">
        <div className="mb-4">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-[#d9e3f7] bg-white px-3.5 py-2 text-[12px] font-bold text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#f8fbff]"
            href="/teacher/rooms"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
            Back to Rooms
          </Link>
        </div>

        <section className="mb-5 rounded-lg border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[640px]">
              <div className="min-w-0">
                <h1 className="text-[1.625rem] font-bold leading-[1.05] text-[#0b1c30]">{room.name}</h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-[#cfe0ff] bg-[#eef4ff] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#3056c4] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    {room.qualification}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
                      roomSubmissionStatus === "submitted" ? "bg-[#edf9f1] text-[#1f7a45]" : "bg-[#fff4db] text-[#8a5200]"
                    }`}
                  >
                    {getRoomSubmissionStatusLabel(roomSubmissionStatus)}
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-[#444653]">
                  Share this code with applicants so they can join the correct assessment room.
                </p>
              </div>

              <div className="mt-3 inline-flex flex-wrap items-center gap-2 border-l-2 border-[#d9e3f7] pl-3.5">
                <span className="text-[12px] font-semibold text-[#747685]">Join Code</span>
                <span className="font-mono text-[16px] font-bold tracking-[0.16em] text-[#002576]">{room.join_code}</span>
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-3 py-1.5 text-[11px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={() => void handleCopyCode()}
                  type="button"
                >
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              </div>

            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">
              <button
                className="inline-flex min-w-[144px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => void runAction("regenerate_code")}
                type="button"
              >
                Regenerate Code
              </button>
              <button
                className="inline-flex min-w-[128px] items-center justify-center rounded-lg border border-[#ba1a1a] bg-white px-4 py-2.5 text-[12px] font-bold text-[#ba1a1a] shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => setIsDeleteModalOpen(true)}
                type="button"
              >
                Delete Room
              </button>
            </div>
          </div>

          {errorMessage ? (
            <NotificationBanner className="mt-5" message={errorMessage} variant="error" />
          ) : null}
        </section>

        <section className="overflow-hidden rounded-lg border border-[#d9e3f7] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="border-b border-[#c4c5d5] bg-[#eff4ff] px-4 py-3.5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[1.25rem] font-bold text-[#0b1c30]">Joined Applicants</h2>
                <p className="mt-0.5 text-[13px] text-[#747685]">{joinedApplicantLabel}</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <i aria-hidden="true" className="fa-solid fa-users text-[11px]" />
                {members.length} Registered
              </div>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-4 text-[14px] leading-[1.6] text-[#747685]">
              No applicants have joined this room yet.
            </div>
          ) : (
            <div className="p-3.5 sm:p-4">
              {members.map((member) => (
                <article key={member.id} className="border-b border-[#eef2fb] py-3 last:border-b-0">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-center">
                    {(() => {
                      const linkedApplication = applicationByApplicantId.get(member.applicant_id);
                      const canRemoveMember = !linkedApplication || !linkedApplication.teacher_forwarded_at;
                      const displayName = linkedApplication?.applicant_name || formatApplicantName(member.applicant_email);

                      return (
                        <>
                    <div className="min-w-0">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-[#0b1c30]">
                          {displayName}
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-[#5d5f5f]">{member.applicant_email}</p>
                      </div>
                    </div>

                    <div className="text-left md:px-3 md:text-center">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">
                        {linkedApplication ? "Submitted At" : "Joined At"}
                      </p>
                      <p className="mt-0.5 text-[14px] font-semibold text-[#24364c]">
                        {linkedApplication
                          ? formatJoinedAt(linkedApplication.submitted_at ?? member.joined_at)
                          : formatJoinedAt(member.joined_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                      {linkedApplication ? (
                        <>
                          <span className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-[#eef4ff] px-3.5 text-[12px] font-bold text-[#3056c4]">
                            Submitted
                          </span>
                          <a
                            className="inline-flex min-w-[108px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-white px-4 py-2.5 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                            href={buildApplicationSubmissionPdfUrl(linkedApplication.id)}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View PDF
                          </a>
                          <button
                            className="inline-flex min-w-[128px] items-center justify-center rounded-lg border border-[#efc5c5] bg-[#fff4f4] px-4 py-2.5 text-[12px] font-bold text-[#93000a] transition hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isUpdating || !canRemoveMember}
                            onClick={() => setMemberPendingRemoval(member)}
                            type="button"
                          >
                            Remove Applicant
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#d9e3f7] bg-[#f8fbff] px-3.5 text-[12px] font-bold text-[#3056c4]">
                            Not Submitted
                          </span>
                          <button
                            className="inline-flex min-w-[128px] items-center justify-center rounded-lg border border-[#efc5c5] bg-[#fff4f4] px-4 py-2.5 text-[12px] font-bold text-[#93000a] transition hover:bg-[#ffeaea] disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isUpdating || !canRemoveMember}
                            onClick={() => setMemberPendingRemoval(member)}
                            type="button"
                          >
                            Remove Applicant
                          </button>
                        </>
                      )}
                    </div>
                        </>
                      );
                    })()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {members.length > 0 ? (
          <div className="mt-5 flex justify-end">
            <button
              className="inline-flex min-w-[96px] items-center justify-center rounded-lg bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:bg-[#0038a8]"
              disabled={isUpdating || !canSubmitBatch}
              onClick={() => setIsSubmitModalOpen(true)}
              type="button"
            >
              Submit
            </button>
          </div>
        ) : null}
      </div>

      <NotificationModal
        actions={
          <div className="flex justify-center">
            <button
              className="inline-flex min-h-[40px] min-w-[104px] items-center justify-center rounded-lg bg-[#002576] px-4 text-[13px] font-bold text-white transition hover:bg-[#0038a8]"
              onClick={() => setSuccessModalMessage("")}
              type="button"
            >
              Okay
            </button>
          </div>
        }
        description="The room batch is now ready for admin review and assessment center assignment."
        message={successModalMessage}
        open={Boolean(successModalMessage)}
        onClose={() => setSuccessModalMessage("")}
        title="Submitted To TESDA"
        variant="success"
      />

      <AnimatedModal
        contentClassName="w-full max-w-[440px] rounded-xl border border-[#d9e3f7] bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isSubmitModalOpen}
      >
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef4ff] text-[#002576]">
            <i aria-hidden="true" className="fa-solid fa-circle-question text-[18px]" />
          </div>
          <div className="mt-4">
            <h2 className="text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">Submit Room Applications?</h2>
            <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
              This will forward{" "}
              <span className="font-bold">
                {submittedToTeacherCount} {submittedToTeacherCount === 1 ? "application" : "applications"}
              </span>{" "}
              from <span className="font-bold">{room.name}</span> to TESDA for review.
            </p>
          </div>
        </div>

        <div className="border-t border-[#e7edf4] pt-4 text-center">
          <p className="text-[13px] leading-[1.55] text-[#3c4f69]">
            Make sure all applicant details are complete before continuing.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            className="inline-flex min-h-[44px] min-w-[100px] items-center justify-center rounded-lg border border-[#c4c5d5] px-4 text-[14px] font-bold text-[#444653] transition hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isUpdating}
            onClick={() => setIsSubmitModalOpen(false)}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex min-h-[44px] min-w-[136px] items-center justify-center rounded-lg bg-[#002576] px-4 text-[14px] font-bold text-white transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isUpdating}
            onClick={() => void runAction("submit_applications")}
            type="button"
          >
            {isUpdating ? "Submitting..." : "Yes, Submit"}
          </button>
        </div>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[440px] rounded-xl border border-[#d9e3f7] bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={isDeleteModalOpen}
      >
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] text-[#ba1a1a]">
                <i aria-hidden="true" className="fa-solid fa-triangle-exclamation text-[18px]" />
              </div>
              <div className="mt-4">
                <h2 className="text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">Delete Room?</h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
                  This will permanently remove <span className="font-bold">{room.name}</span> and all joined memberships still attached to it.
                </p>
              </div>
            </div>

            <div className="border-t border-[#f0d5d5] pt-4 text-center">
              <p className="text-[13px] leading-[1.55] text-[#7a3b3b]">
                Delete is only allowed after all joined applicants are removed and no active room submissions are still in progress.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                className="inline-flex min-h-[44px] min-w-[100px] items-center justify-center rounded-lg border border-[#c4c5d5] px-4 text-[14px] font-bold text-[#444653] transition hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="inline-flex min-h-[44px] min-w-[136px] items-center justify-center rounded-lg bg-[#d97a7a] px-4 text-[14px] font-bold text-white transition hover:bg-[#c96a6a] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => void handleDeleteRoom()}
                type="button"
              >
                {isUpdating ? "Deleting..." : "Yes, Delete Room"}
              </button>
            </div>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[440px] rounded-xl border border-[#d9e3f7] bg-white p-7 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(memberPendingRemoval)}
      >
        {memberPendingRemoval ? (
          <>
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4f4] text-[#b42318]">
                <i aria-hidden="true" className="fa-solid fa-user-minus text-[18px]" />
              </div>
              <div className="mt-4">
                <h2 className="text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">Remove Applicant?</h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
                  This will remove <span className="font-bold">{formatApplicantName(memberPendingRemoval.applicant_email)}</span> from{" "}
                  <span className="font-bold">{room.name}</span>.
                </p>
              </div>
            </div>

            <div className="border-t border-[#e7edf4] pt-4 text-center">
              <p className="text-[13px] leading-[1.55] text-[#3c4f69]">
                Applicants can only be removed before the teacher submits this room to TESDA. Submitted room records still stay in the workflow history.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                className="inline-flex min-h-[44px] min-w-[100px] items-center justify-center rounded-lg border border-[#c4c5d5] px-4 text-[14px] font-bold text-[#444653] transition hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => setMemberPendingRemoval(null)}
                type="button"
              >
                Keep Applicant
              </button>
              <button
                className="inline-flex min-h-[44px] min-w-[156px] items-center justify-center rounded-lg bg-[#b42318] px-4 text-[14px] font-bold text-white transition hover:bg-[#991b1b] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => void handleRemoveMember()}
                type="button"
              >
                {isUpdating ? "Removing..." : "Yes, Remove Applicant"}
              </button>
            </div>
          </>
        ) : null}
      </AnimatedModal>

      <NotificationToast
        message={message}
        onClose={() => setMessage("")}
        open={Boolean(message)}
        title="Room Updated"
        variant="success"
      />
    </main>
  );
}
