"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { RoomRecord } from "@/lib/rooms";

type JoinRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
};

type JoinedRoomMembership = {
  id: string;
  joined_at: string;
  rooms:
    | {
        id: string;
        name: string;
        qualification: string;
        join_code: string;
        is_active: boolean;
        created_at: string;
      }
    | null;
};

export default function ApplicantJoinRoomPage() {
  const [code, setCode] = useState("");
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [joinedRoomsError, setJoinedRoomsError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinedRooms, setJoinedRooms] = useState<JoinedRoomMembership[]>([]);

  useEffect(() => {
    if (room || (!message && !errorMessage)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [message, errorMessage, room]);

  useEffect(() => {
    let cancelled = false;

    async function loadJoinedRooms() {
      try {
        const response = await fetch("/api/applicant/rooms");
        const payload = (await response.json()) as {
          success: boolean;
          message?: string;
          memberships?: JoinedRoomMembership[];
        };

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.success) {
          setJoinedRoomsError(payload.message ?? "Unable to load joined rooms.");
          return;
        }

        setJoinedRooms(payload.memberships ?? []);
      } catch {
        if (!cancelled) {
          setJoinedRoomsError("Unable to load joined rooms right now.");
        }
      }
    }

    void loadJoinedRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRooms = useMemo(
    () => joinedRooms.filter((membership): membership is JoinedRoomMembership & { rooms: NonNullable<JoinedRoomMembership["rooms"]> } => Boolean(membership.rooms)),
    [joinedRooms],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");
    setRoom(null);

    try {
      const response = await fetch("/api/applicant/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const payload = (await response.json()) as JoinRoomResponse;

      if (!response.ok || !payload.success || !payload.room) {
        setErrorMessage(payload.message ?? "Unable to join room.");
        return;
      }

      setRoom(payload.room);
      setMessage(payload.message ?? "Joined room successfully.");
      setCode("");
      setIsJoinModalOpen(false);
      setJoinedRooms((currentRooms) => [
        {
          id: `joined-${payload.room!.id}`,
          joined_at: new Date().toISOString(),
          rooms: payload.room!,
        },
        ...currentRooms.filter((membership) => membership.rooms?.id !== payload.room!.id),
      ]);
    } catch {
      setErrorMessage("Unable to join room right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#747685]">Applicant Rooms</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] text-[#002576]">Joined Assessment Rooms</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[#444653]">
              Review the rooms you already joined and enter a new teacher-provided code whenever you need to connect to another assessment room.
            </p>
          </div>
        </section>

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">
            {errorMessage}
          </div>
        ) : null}

        {joinedRoomsError ? (
          <div className="mb-6 rounded-xl border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">
            {joinedRoomsError}
          </div>
        ) : null}

        {!joinedRoomsError && visibleRooms.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-[#c4c5d5] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
              <i aria-hidden="true" className="fa-solid fa-right-to-bracket text-[18px]" />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold text-[#0b1c30]">No joined rooms yet</h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#444653]">
              Use a room code from your teacher to join your first assessment room.
            </p>
            <button
              className="mt-5 rounded-xl bg-[#002576] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              onClick={() => setIsJoinModalOpen(true)}
              type="button"
            >
              Join Your First Room
            </button>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleRooms.map((membership) => (
            <article
              key={membership.id}
              className="relative overflow-hidden rounded-2xl border border-[#c9d7f5] bg-white px-5 pb-5 pt-4 shadow-sm"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#002576]" />

              <div className="mb-4">
                <h2 className="max-w-[220px] text-[18px] font-bold leading-[1.25] text-[#24364c]">{membership.rooms.name}</h2>
                <span className="mt-3 inline-flex rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4]">
                  {membership.rooms.qualification}
                </span>
              </div>

              <div className="space-y-3 text-[14px] text-[#5d5f5f]">
                <div className="flex items-center gap-3">
                  <i aria-hidden="true" className="fa-solid fa-hashtag text-[15px] text-[#5d5f5f]" />
                  <p>
                    <span className="font-semibold">Room Code:</span>{" "}
                    <span className="font-bold text-[#24364c]">{membership.rooms.join_code}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <i aria-hidden="true" className="fa-regular fa-clock text-[15px] text-[#5d5f5f]" />
                  <p>
                    <span className="font-semibold">Joined:</span>{" "}
                    <span className="text-[#24364c]">{formatJoinedAt(membership.joined_at)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] ${
                    membership.rooms.is_active ? "bg-[#dce1ff] text-[#093cab]" : "bg-[#dfe0e0] text-[#616363]"
                  }`}
                >
                  {membership.rooms.is_active ? "Active Room" : "Inactive Room"}
                </span>
              </div>

              <Link
                className="mt-6 flex items-center justify-center rounded-xl bg-[#0038a8] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#002576]"
                href={`/applicant/rooms/${membership.rooms.id}`}
              >
                Open Room
              </Link>
            </article>
          ))}
        </section>
      </div>

      <button
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-[#002576] px-5 py-3 text-[14px] font-bold text-white shadow-[0_16px_40px_rgba(0,37,118,0.25)] transition hover:bg-[#0038a8] lg:right-8"
        onClick={() => setIsJoinModalOpen(true)}
        type="button"
      >
        <i aria-hidden="true" className="fa-solid fa-right-to-bracket text-[13px]" />
        Join Room
      </button>

      {isJoinModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4">
          <div className="w-full max-w-[560px] rounded-[24px] border border-[#c4c5d5] bg-white p-6 shadow-[0_24px_60px_rgba(4,15,37,0.22)] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[1.5rem] font-semibold leading-[1.2] text-[#0b1c30] sm:text-[1.75rem]">
                  Join Assessment Room
                </h2>
                <p className="mt-1.5 max-w-xl text-[13px] leading-[1.55] text-[#444653]">
                  Enter the room code shared by your teacher to join the correct assessment room.
                </p>
              </div>
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5d5f5f] transition hover:bg-[#f3f6fd]"
                onClick={() => {
                  setIsJoinModalOpen(false);
                  setErrorMessage("");
                }}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#444653]" htmlFor="room-code">
                  Room Code
                </label>
                <input
                  className="w-full rounded-xl border border-[#c4c5d5] bg-[#f8f9ff] px-4 py-3 text-center font-mono text-[18px] font-bold uppercase tracking-[0.22em] text-[#002576] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  id="room-code"
                  maxLength={8}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="A7KQ2P"
                  required
                  value={code}
                />
                <p className="text-[11px] font-medium text-[#747685]">
                  Ask your teacher for the latest room code if this one does not work.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#c4c5d5] pt-5 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-[#002576] px-4 py-3 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff] active:scale-[0.98]"
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    setErrorMessage("");
                    setCode("");
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex items-center justify-center rounded-xl bg-[#002576] px-5 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-[#0038a8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Joining..." : "Join Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {room ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4">
          <div className="w-full max-w-[440px] rounded-[24px] border border-[#c4c5d5] bg-white p-7 shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
            <div className="mb-5 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#effaf2] text-[#1e5d31]">
                <i aria-hidden="true" className="fa-solid fa-circle-check text-[18px]" />
              </div>
              <div className="mt-3">
                <h2 className="text-[18px] font-semibold leading-[1.3] text-[#0b1c30]">Joined Room Successfully</h2>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-[#444653]">
                  {message || "You are now connected to the assessment room. You can open it now or return later from your dashboard."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d9e3f7] bg-[#f8fbff] p-5">
              <div className="space-y-5">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Room Name</p>
                  <p className="mt-2 text-[16px] font-bold leading-[1.35] text-[#0b1c30]">{room.name}</p>
                </div>

                <div className="border-t border-[#d9e3f7] pt-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#747685]">Join Code</p>
                  <p className="mt-2 font-mono text-[22px] font-bold tracking-[0.22em] text-[#002576]">{room.join_code}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="min-w-[96px] rounded-xl border border-[#c4c5d5] px-5 py-3 text-[13px] font-bold text-[#444653] transition hover:bg-[#f8f9ff]"
                onClick={() => {
                  setRoom(null);
                  setMessage("");
                }}
                type="button"
              >
                Close
              </button>
              <Link
                className="min-w-[120px] rounded-xl bg-[#002576] px-5 py-3 text-center text-[13px] font-bold text-white transition hover:bg-[#0038a8]"
                href={`/applicant/rooms/${room.id}`}
                onClick={() => {
                  setRoom(null);
                  setMessage("");
                }}
              >
                Open Room
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function formatJoinedAt(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
