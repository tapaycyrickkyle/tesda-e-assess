"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { getRoomSubmissionStatusLabel, type RoomRecord } from "@/lib/rooms";

type CreateRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
};

type TeacherRoomClientProps = {
  initialRooms: RoomRecord[];
  initialLoadError?: string;
  qualificationOptions: string[];
  teacherInstitutionName: string;
};

export default function TeacherRoomClient({
  initialRooms,
  initialLoadError,
  qualificationOptions,
  teacherInstitutionName,
}: TeacherRoomClientProps) {
  const [qualification, setQualification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialLoadError ?? "");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdRoom, setCreatedRoom] = useState<RoomRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [rooms, setRooms] = useState<RoomRecord[]>(initialRooms);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (createdRoom || (!successMessage && !errorMessage)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage, errorMessage, createdRoom]);

  const sortedRooms = useMemo(
    () => [...rooms].sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()),
    [rooms],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setCreatedRoom(null);
    setCopiedCode(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/teacher/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teacherInstitutionName,
          qualification,
        }),
      });

      const payload = (await response.json()) as CreateRoomResponse;

      if (!response.ok || !payload.success || !payload.room) {
        setErrorMessage(payload.message ?? "Unable to create room.");
        return;
      }

      setCreatedRoom(payload.room);
      setSuccessMessage(payload.message ?? "Room created successfully.");
      setQualification("");
      setIsCreateModalOpen(false);
      setRooms((currentRooms) => [payload.room!, ...currentRooms]);
    } catch {
      setErrorMessage("Unable to create room right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyCode() {
    if (!createdRoom) {
      return;
    }

    try {
      await navigator.clipboard.writeText(createdRoom.join_code);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setErrorMessage("Unable to copy the room code. Please copy it manually.");
    }
  }

  function getStatusStyles(status: RoomRecord["submission_status"]) {
    if (status === "submitted") {
      return {
        badge: "border border-[#cce9d8] bg-[#edf9f1] text-[#1f7a45]",
      };
    }

    return {
      badge: "border border-[#f1dfb4] bg-[#fff4db] text-[#8a5200]",
    };
  }

  return (
    <main className="ui-portal-main pb-24 pt-6">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Assessment Rooms</h1>
          <p className="ui-page-description">
            Manage room codes, joined applicants, and room submission progress.
          </p>
        </section>

        {errorMessage ? (
          <NotificationBanner className="mb-5" message={errorMessage} variant="error" />
        ) : null}

        {sortedRooms.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#d9e3f7] bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
              <i aria-hidden="true" className="fa-solid fa-door-open text-[18px]" />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold text-[#0b1c30]">No rooms yet</h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#444653]">
              Start by creating your first room and sharing its generated join code with applicants.
            </p>
            <button
              className="mt-5 rounded-lg bg-[#002576] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              onClick={() => setIsCreateModalOpen(true)}
              type="button"
            >
              Create First Room
            </button>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {sortedRooms.map((room) => (
            <article
              key={room.id}
              className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-xl border border-[#d9e3f7] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[#002576]" />

              <div className="mb-4 flex flex-col items-center text-center">
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
                  <i aria-hidden="true" className="fa-solid fa-door-open text-[14px]" />
                </div>
                <div className="w-full">
                  <h2 className="mx-auto max-w-[220px] text-[17px] font-bold leading-[1.25] text-[#24364c]">{room.name}</h2>
                  <div className="mt-2.5 flex min-h-[50px] flex-wrap content-start items-start justify-center gap-2">
                    <span className="inline-flex max-w-full items-center justify-center rounded-full border border-[#d6e2fb] bg-[#eef3ff] px-3 py-1 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                      {room.qualification}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] ${
                        getStatusStyles(room.submission_status).badge
                      }`}
                    >
                      {getRoomSubmissionStatusLabel(room.submission_status ?? "not_submitted")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[#d9e3f7] bg-white p-3">
                <div className="flex items-center justify-between gap-3 border-b border-[#d9e3f7] pb-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-solid fa-hashtag text-[14px] text-[#5d5f5f]" />
                    Room Code
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-mono text-[13px] font-bold tracking-[0.14em] text-[#002576] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                    {room.join_code}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-solid fa-users text-[14px] text-[#5d5f5f]" />
                    Applicants
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#24364c]">
                    {room.member_count ?? 0} joined
                  </span>
                </div>
              </div>

              <Link
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#002576]"
                href={`/teacher/rooms/${room.id}`}
              >
                <span>View Room</span>
                <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
              </Link>
            </article>
          ))}
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-lg bg-[#002576] px-5 py-3 text-[14px] font-bold text-white shadow-[0_10px_24px_rgba(0,37,118,0.16)] transition hover:bg-[#0038a8] lg:right-8"
        onClick={() => setIsCreateModalOpen(true)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-plus text-[13px]" />
        Add Room
      </button>

      <AnimatedModal
        contentClassName="w-full max-w-[620px] rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] sm:p-4"
        open={isCreateModalOpen}
      >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[#0b1c30] sm:text-[1.75rem]">
                  Create New Assessment Room
                </h2>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.55] text-[#444653]">
                  Set up a new room for your institution and generate a join code for applicants. The room name is assigned automatically from your school profile.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setErrorMessage("");
                }}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium text-[#444653]" htmlFor="room-name">
                    Room Name
                  </label>
                  <div className="relative">
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-school pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#3056c4]"
                    />
                    <input
                      className="w-full rounded-lg border border-[#d9e3f7] bg-[#eef4ff] py-2.5 pl-10 pr-4 text-[13px] font-medium text-[#0b1c30] outline-none"
                      id="room-name"
                      readOnly
                      type="text"
                      value={teacherInstitutionName || "School profile required"}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-[#747685]">
                    This value comes from the approved teacher school name saved in your profile.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[13px] font-medium text-[#444653]" htmlFor="course">
                    Qualification / Course
                  </label>
                  <div className="group relative">
                    <i
                      aria-hidden="true"
                      className="fa-regular fa-clipboard pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                    />
                    <select
                      className="w-full appearance-none rounded-lg border border-[#c4c5d5] bg-[#f8f9ff] py-2.5 pl-10 pr-10 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                      id="course"
                      onChange={(event) => setQualification(event.target.value)}
                      required
                      value={qualification}
                    >
                      <option value="">Select a qualification...</option>
                      {qualificationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                    />
                  </div>
                  {qualificationOptions.length === 0 ? (
                    <p className="text-[11px] font-medium text-[#93000a]">
                      No active programs are available right now. Ask the admin to enable a program first.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#c4c5d5] pt-4 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#002576] px-4 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff] active:scale-[0.98]"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setErrorMessage("");
                    setQualification("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:bg-[#0038a8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || !teacherInstitutionName.trim() || !qualification || qualificationOptions.length === 0}
                  type="submit"
                >
                  {isSubmitting ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[420px] rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
        open={Boolean(createdRoom)}
      >
        {createdRoom ? (
          <>
            <div className="mb-4 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#effaf2] text-[#1e5d31] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                <i aria-hidden="true" className="fa-solid fa-circle-check text-[18px]" />
              </div>
              <div className="mt-2.5 min-w-0">
                <h2 className="text-[18px] font-semibold leading-[1.3] text-[#0b1c30]">Room Created Successfully</h2>
                <p className="mt-1 text-[14px] leading-[1.55] text-[#444653]">
                  {successMessage || "Your assessment room is ready. Share the code below with applicants."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Room Name</p>
                <p className="mt-1.5 text-[17px] font-bold leading-[1.35] text-[#0b1c30]">{createdRoom.name}</p>
              </div>

              <div className="border-t border-[#e7edf4] pt-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Join Code</p>
                    <p className="mt-1.5 font-mono text-[22px] font-bold tracking-[0.22em] text-[#002576]">{createdRoom.join_code}</p>
                  </div>
                  <button
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg border border-[#002576] bg-white px-4 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                    onClick={() => void handleCopyCode()}
                    type="button"
                  >
                    {copiedCode ? "Copied" : "Copy Code"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-[44px] min-w-[96px] items-center justify-center rounded-lg border border-[#c4c5d5] px-5 text-[14px] font-bold text-[#444653] transition hover:bg-[#f8f9ff]"
                onClick={() => {
                  setCreatedRoom(null);
                  setSuccessMessage("");
                }}
                type="button"
              >
                Close
              </button>
              <Link
                className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-lg bg-[#002576] px-5 text-center text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
                href={`/teacher/rooms/${createdRoom.id}`}
                onClick={() => {
                  setCreatedRoom(null);
                  setSuccessMessage("");
                }}
              >
                Open Room
              </Link>
            </div>
          </>
        ) : null}
      </AnimatedModal>
    </main>
  );
}
