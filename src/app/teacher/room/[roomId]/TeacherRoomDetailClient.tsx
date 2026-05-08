"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomRecord } from "@/lib/rooms";

type RoomMember = {
  id: string;
  applicant_id: string;
  applicant_email: string;
  joined_at: string;
};

type TeacherRoomDetailClientProps = {
  initialMembers: RoomMember[];
  initialRoom: RoomRecord;
};

type UpdateRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
};

type DeleteRoomResponse = {
  success: boolean;
  message?: string;
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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TeacherRoomDetailClient({
  initialMembers,
  initialRoom,
}: TeacherRoomDetailClientProps) {
  const router = useRouter();
  const [room, setRoom] = useState(initialRoom);
  const [members] = useState(initialMembers);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const joinedApplicantLabel =
    members.length === 1 ? "1 applicant currently joined" : `${members.length} applicants currently joined`;

  useEffect(() => {
    if (!message && !errorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 4000);

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

  async function runAction(action: "regenerate_code") {
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

      if (!response.ok || !payload.success || !payload.room) {
        setErrorMessage(payload.message ?? "Unable to update room.");
        return;
      }

      setRoom(payload.room);
      setMessage(payload.message ?? "Room updated successfully.");
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
      router.push("/teacher/room");
      router.refresh();
    } catch {
      setErrorMessage("Unable to delete the room right now. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-8 pt-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-4">
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-[#c9d7f5] bg-white px-3.5 py-2 text-[12px] font-bold text-[#002576] shadow-sm transition hover:bg-[#f8fbff]"
            href="/teacher/room"
          >
            <i aria-hidden="true" className="fa-solid fa-arrow-left text-[11px]" />
            Back to Rooms
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-[#c4c5d5] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-[640px]">
              <div className="min-w-0">
                <h1 className="text-[1.625rem] font-bold leading-[1.05] text-[#0b1c30]">{room.name}</h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eff4ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3056c4]">
                    {room.qualification}
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] leading-[1.55] text-[#444653]">
                  Share this code with applicants so they can join the correct assessment room.
                </p>
              </div>

              <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-xl border border-[#d9e3f7] bg-[#f8fbff] px-3.5 py-2">
                <span className="text-[12px] font-semibold text-[#747685]">Join Code</span>
                <span className="font-mono text-[16px] font-bold tracking-[0.16em] text-[#002576]">{room.join_code}</span>
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-[#c9d7f5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                  onClick={() => void handleCopyCode()}
                  type="button"
                >
                  {copiedCode ? "Copied" : "Copy Code"}
                </button>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">
              <button
                className="inline-flex min-w-[144px] items-center justify-center rounded-xl bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#0038a8] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => void runAction("regenerate_code")}
                type="button"
              >
                Regenerate Code
              </button>
              <button
                className="inline-flex min-w-[128px] items-center justify-center rounded-xl border border-[#ba1a1a] bg-white px-4 py-2.5 text-[12px] font-bold text-[#ba1a1a] shadow-sm transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => setIsDeleteModalOpen(true)}
                type="button"
              >
                Delete Room
              </button>
            </div>
          </div>

          {message ? (
            <div className="mt-5 rounded-xl border border-[#b9d6c1] bg-[#effaf2] p-4 text-[14px] text-[#1e5d31]">{message}</div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-xl border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">{errorMessage}</div>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#c4c5d5] bg-white shadow-sm">
          <div className="border-b border-[#c4c5d5] bg-[#eff4ff] px-5 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[1.25rem] font-bold text-[#0b1c30]">Joined Applicants</h2>
                <p className="mt-0.5 text-[13px] text-[#747685]">{joinedApplicantLabel}</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#002576] shadow-sm">
                <i aria-hidden="true" className="fa-solid fa-users text-[11px]" />
                {members.length} Registered
              </div>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="p-6 text-[14px] leading-[1.6] text-[#747685]">
              No applicants have joined this room yet.
            </div>
          ) : (
            <div className="p-3.5 sm:p-4">
              {members.map((member) => (
                <article
                  key={member.id}
                  className="border-b border-[#eef2fb] py-3 last:border-b-0"
                >
                  <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0ff] text-[12px] font-bold text-[#002576]">
                        {getInitials(formatApplicantName(member.applicant_email))}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-[#0b1c30]">{formatApplicantName(member.applicant_email)}</p>
                        <p className="mt-0.5 truncate text-[13px] text-[#5d5f5f]">{member.applicant_email}</p>
                      </div>
                    </div>

                    <div className="md:pl-3 md:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Joined At</p>
                      <p className="mt-0.5 text-[14px] font-semibold text-[#24364c]">{formatJoinedAt(member.joined_at)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {members.length > 0 ? (
          <div className="mt-5 flex justify-end">
            <button
              className="inline-flex min-w-[96px] items-center justify-center rounded-xl bg-[#002576] px-4 py-2.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-[#0038a8]"
              type="button"
            >
              Submit
            </button>
          </div>
        ) : null}
      </div>

      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4">
          <div className="w-full max-w-[440px] rounded-[24px] border border-[#c4c5d5] bg-white p-7 shadow-[0_24px_60px_rgba(4,15,37,0.22)]">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff1f1] text-[#ba1a1a]">
                <i aria-hidden="true" className="fa-solid fa-triangle-exclamation text-[18px]" />
              </div>
              <div className="mt-4">
                <h2 className="text-[22px] font-semibold leading-[1.3] text-[#0b1c30]">Delete Room?</h2>
                <p className="mt-2 text-[15px] leading-[1.6] text-[#444653]">
                  This will permanently remove <span className="font-bold">{room.name}</span> and all applicant memberships connected to it.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#f4d2d2] bg-[#fff8f8] px-4 py-3 text-center">
              <p className="text-[13px] leading-[1.55] text-[#7a3b3b]">
                This action cannot be undone.
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
              <button
                className="min-w-[100px] rounded-xl border border-[#c4c5d5] px-4 py-2.5 text-[12px] font-bold text-[#444653] transition hover:bg-[#f8f9ff] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => setIsDeleteModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-w-[136px] rounded-xl bg-[#ba1a1a] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#93000a] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={isUpdating}
                onClick={() => void handleDeleteRoom()}
                type="button"
              >
                {isUpdating ? "Deleting..." : "Yes, Delete Room"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
