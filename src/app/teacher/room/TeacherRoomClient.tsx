"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import AnimatedModal from "@/components/AnimatedModal";
import type { RoomRecord } from "@/lib/rooms";

const qualificationOptions = [
  "Computer Systems Servicing NC II",
  "Cookery NC II",
  "Automotive Servicing NC I",
  "Health Care Services NC II",
  "Visual Graphic Design NC III",
];

type CreateRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
};

type TeacherRoomClientProps = {
  initialRooms: RoomRecord[];
  initialLoadError?: string;
};

export default function TeacherRoomClient({ initialRooms, initialLoadError }: TeacherRoomClientProps) {
  const [roomName, setRoomName] = useState("");
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
          name: roomName,
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
      setRoomName("");
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

  return (
    <main className="min-h-screen px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#747685]">Teacher Rooms</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] text-[#002576]">Assessment Rooms</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[#444653]">
              Manage room codes, review applicant turnout, and open each room for the next assessment step.
            </p>
          </div>
        </section>

        {errorMessage ? (
          <div className="mb-6 rounded-lg border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">
            {errorMessage}
          </div>
        ) : null}

        {sortedRooms.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#c4c5d5] bg-white p-8 text-center shadow-sm">
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

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sortedRooms.map((room) => (
            <article
              key={room.id}
              className="relative overflow-hidden rounded-lg border border-[#c9d7f5] bg-white px-5 pb-5 pt-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#002576]" />

              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
                  <i aria-hidden="true" className="fa-solid fa-door-open text-[16px]" />
                </div>
                <div className="w-full">
                  <h2 className="mx-auto max-w-[220px] text-[18px] font-bold leading-[1.25] text-[#24364c]">{room.name}</h2>
                  <span className="mx-auto mt-3 inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4]">
                    {room.qualification}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] p-4">
                <div className="flex items-center justify-between gap-3 border-b border-[#d9e3f7] pb-3">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-solid fa-hashtag text-[14px] text-[#5d5f5f]" />
                    Room Code
                  </span>
                  <span className="rounded-md bg-white px-3 py-1 font-mono text-[13px] font-bold tracking-[0.14em] text-[#002576]">
                    {room.join_code}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3">
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
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#002576]"
                href={`/teacher/room/${room.id}`}
              >
                <span>View Applicants</span>
                <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
              </Link>
            </article>
          ))}
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#002576] px-5 py-3 text-[14px] font-bold text-white shadow-[0_16px_40px_rgba(0,37,118,0.25)] transition hover:bg-[#0038a8] lg:right-8"
        onClick={() => setIsCreateModalOpen(true)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-plus text-[13px]" />
        Add Room
      </button>

      <AnimatedModal
        contentClassName="w-full max-w-[760px] rounded-[20px] border border-[#c4c5d5] bg-white p-6 shadow-[0_24px_60px_rgba(4,15,37,0.22)] sm:p-7"
        open={isCreateModalOpen}
      >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[#0b1c30] sm:text-[1.75rem]">
                  Create New Assessment Room
                </h2>
                <p className="mt-1.5 max-w-2xl text-[13px] leading-[1.55] text-[#444653]">
                  Establish a new environment for institutional competency assessments and generate a join code for applicants.
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

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-2">
                  <label className="block text-[13px] font-medium text-[#444653]" htmlFor="room-name">
                    Room Name
                  </label>
                  <div className="group relative">
                    <i
                      aria-hidden="true"
                      className="fa-solid fa-door-open pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#747685] transition-colors group-focus-within:text-[#002576]"
                    />
                    <input
                      className="w-full rounded-lg border border-[#c4c5d5] bg-[#f8f9ff] py-3 pl-10 pr-4 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                      id="room-name"
                      onChange={(event) => setRoomName(event.target.value.toUpperCase())}
                      placeholder="e.g., Computer Lab 101"
                      required
                      type="text"
                      value={roomName}
                    />
                  </div>
                  <p className="text-[10px] font-semibold text-[#747685]">
                    Provide a unique and identifiable name for the assessment area.
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
                      className="w-full appearance-none rounded-lg border border-[#c4c5d5] bg-[#f8f9ff] py-3 pl-10 pr-10 text-[13px] text-[#0b1c30] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
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
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#c4c5d5] pt-5 sm:flex-row sm:justify-end">
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#002576] px-4 text-[14px] font-bold text-[#002576] transition hover:bg-[#eff4ff] active:scale-[0.98]"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setErrorMessage("");
                    setRoomName("");
                    setQualification("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#002576] px-5 text-[14px] font-bold text-white shadow-md transition hover:bg-[#0038a8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Creating..." : "Create Room"}
                </button>
              </div>
            </form>
      </AnimatedModal>

      <AnimatedModal
        contentClassName="w-full max-w-[440px] rounded-[20px] border border-[#c4c5d5] bg-white p-7 shadow-[0_24px_60px_rgba(4,15,37,0.22)]"
        open={Boolean(createdRoom)}
      >
        {createdRoom ? (
          <>
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#effaf2] text-[#1e5d31]">
                <i aria-hidden="true" className="fa-solid fa-circle-check text-[18px]" />
              </div>
              <div className="mt-3 min-w-0">
                <h2 className="text-[18px] font-semibold leading-[1.3] text-[#0b1c30]">Room Created Successfully</h2>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-[#444653]">
                  {successMessage || "Your assessment room is ready. Share the code below with applicants."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-[#d9e3f7] bg-[#f8fbff] p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Room Name</p>
                  <p className="mt-2 text-[16px] font-bold leading-[1.35] text-[#0b1c30]">{createdRoom.name}</p>
                </div>

                <div className="border-t border-[#d9e3f7] pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Join Code</p>
                      <p className="mt-2 font-mono text-[22px] font-bold tracking-[0.22em] text-[#002576]">{createdRoom.join_code}</p>
                    </div>
                    <button
                      className="shrink-0 rounded-lg border border-[#002576] bg-white px-3 py-2 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      onClick={() => void handleCopyCode()}
                      type="button"
                    >
                      {copiedCode ? "Copied" : "Copy Code"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                href={`/teacher/room/${createdRoom.id}`}
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
