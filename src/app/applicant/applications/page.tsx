"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { normalizeRoomCode, type RoomRecord } from "@/lib/rooms";

type ApplicationPathCardProps = {
  description: string;
  href?: string;
  icon: ReactNode;
  onClick?: () => void;
  title: string;
};

type JoinRoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomRecord;
};

function IndividualApplicationIcon() {
  return (
    <svg aria-hidden className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 19.5a6.5 6.5 0 0 1 13 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function JoinAssessmentRoomIcon() {
  return (
    <svg aria-hidden className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M8 4.75h7a2.25 2.25 0 0 1 2.25 2.25v10A2.25 2.25 0 0 1 15 19.25H8m0-14.5v14.5m0-14.5 7.25.5m-7.25 14 7.25-.5M12.5 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ApplicationPathCard({ description, href, icon, onClick, title }: ApplicationPathCardProps) {
  const content = (
    <>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-[#002576]" />
      <div className="absolute right-4 top-4 rounded-full bg-[#eef3ff] px-2.5 py-1 text-[11px] font-bold text-[#3056c4] transition group-hover:bg-[#dfe9ff]">
        Select
      </div>

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576] transition group-hover:bg-[#dfe9ff]">
        {icon}
      </div>

      <div className="mt-4 w-full max-w-[360px]">
        <h2 className="text-[26px] font-bold leading-[1.2] text-[#0038a8]">{title}</h2>
        <p className="mt-2 text-[14px] leading-[1.6] text-[#5d5f5f]">{description}</p>
      </div>

      <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-[#002576]">
        <span>Continue</span>
        <i aria-hidden="true" className="fa-solid fa-arrow-right text-[11px] transition group-hover:translate-x-0.5" />
      </div>
    </>
  );

  const className =
    "group relative flex min-h-[228px] flex-col items-center justify-center overflow-hidden rounded-lg border border-[#c4c5d5] bg-white px-6 py-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#8eacf0] hover:bg-[#f8fbff] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002576]";

  if (onClick) {
    return (
      <button className={className} onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return (
    <Link className={className} href={href ?? "/applicant/applications"}>
      {content}
    </Link>
  );
}

export default function ApplicantApplicationsPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timeoutId);
  }, [errorMessage]);

  async function handleJoinRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/applicant/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizeRoomCode(code) }),
      });

      const payload = (await response.json()) as JoinRoomResponse;

      if (!response.ok || !payload.success || !payload.room) {
        setErrorMessage(payload.message ?? "Unable to join room.");
        return;
      }

      setIsJoinModalOpen(false);
      setCode("");
      router.push("/applicant/room");
      router.refresh();
    } catch {
      setErrorMessage("Unable to join room right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 pb-8 pt-8 text-[#0b1c30] sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-10 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Choose Your Application Path</h1>
            <p className="mt-3 text-[17px] leading-[1.6] text-[#444653]">
              Select how you would like to proceed with your competency assessment.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          <ApplicationPathCard
            description="Apply for a competency assessment independently. Best for self-paced candidates or those not affiliated with a specific training center batch."
            href="/applicant/dashboard"
            icon={<IndividualApplicationIcon />}
            title="Individual Application"
          />

          <ApplicationPathCard
            description="Use a room code provided by your instructor or institution to join a scheduled group assessment batch."
            icon={<JoinAssessmentRoomIcon />}
            onClick={() => {
              setErrorMessage("");
              setCode("");
              setIsJoinModalOpen(true);
            }}
            title="Join Assessment Room"
          />
        </section>
      </div>

      {isJoinModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/45 px-4">
          <div className="w-full max-w-[560px] rounded-lg border border-[#c4c5d5] bg-white p-6 shadow-[0_24px_60px_rgba(4,15,37,0.22)] sm:p-7">
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
                  setCode("");
                }}
                type="button"
              >
                <i aria-hidden="true" className="fa-solid fa-xmark text-[15px]" />
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleJoinRoom}>
              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#444653]" htmlFor="room-code">
                  Room Code
                </label>
                <input
                  className="w-full rounded-lg border border-[#c4c5d5] bg-[#f8f9ff] px-4 py-3 text-center font-mono text-[18px] font-bold uppercase tracking-[0.22em] text-[#002576] outline-none transition focus:border-[#002576] focus:ring-2 focus:ring-[#3056c4]/15"
                  id="room-code"
                  maxLength={8}
                  onChange={(event) => setCode(normalizeRoomCode(event.target.value))}
                  placeholder="A7KQ2P"
                  required
                  value={code}
                />
                <p className="text-[11px] font-medium text-[#747685]">
                  Ask your teacher for the latest room code if this one does not work.
                </p>
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 border-t border-[#c4c5d5] pt-5 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-[#002576] px-4 py-3 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff] active:scale-[0.98]"
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
                  className="flex items-center justify-center rounded-lg bg-[#002576] px-5 py-3 text-[13px] font-bold text-white shadow-md transition hover:bg-[#0038a8] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
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
    </main>
  );
}
