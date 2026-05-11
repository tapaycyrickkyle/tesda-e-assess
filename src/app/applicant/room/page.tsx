import Link from "next/link";
import { getCurrentAppUser } from "@/lib/current-user";
import { createSupabaseAccessTokenClient } from "@/lib/supabase";

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

type JoinedRoomMembershipRow = {
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
    | Array<{
        id: string;
        name: string;
        qualification: string;
        join_code: string;
        is_active: boolean;
        created_at: string;
      }>
    | null;
};

export default async function ApplicantRoomPage() {
  let joinedRoomsError = "";
  let visibleRooms: Array<JoinedRoomMembership & { rooms: NonNullable<JoinedRoomMembership["rooms"]> }> = [];
  const submissionStatusByRoomId = new Map<string, "submitted_to_teacher" | "submitted_to_admin">();

  const currentUser = await getCurrentAppUser();

  if (currentUser?.role === "student") {
    const supabase = createSupabaseAccessTokenClient(currentUser.accessToken);
    const { data, error } = await supabase
      .from("room_members")
      .select("id, joined_at, rooms(id, name, qualification, join_code, is_active, created_at)")
      .eq("applicant_id", currentUser.id)
      .order("joined_at", { ascending: false });

    if (error) {
      joinedRoomsError =
        "Unable to load joined rooms yet. Make sure the room membership tables and their RLS policies are available in Supabase.";
    } else {
      visibleRooms = ((data ?? []) as JoinedRoomMembershipRow[])
        .map((membership) => ({
          id: membership.id,
          joined_at: membership.joined_at,
          rooms: Array.isArray(membership.rooms) ? membership.rooms[0] ?? null : membership.rooms,
        }))
        .filter(
          (membership): membership is JoinedRoomMembership & { rooms: NonNullable<JoinedRoomMembership["rooms"]> } =>
            Boolean(membership.rooms),
        );

      if (visibleRooms.length > 0) {
        const { data: submissions } = await supabase
          .from("applicant_application_submissions")
          .select("room_id, workflow_status")
          .eq("applicant_id", currentUser.id)
          .in(
            "room_id",
            visibleRooms.map((membership) => membership.rooms.id),
          );

        for (const submission of submissions ?? []) {
          if (submission.room_id) {
            submissionStatusByRoomId.set(
              submission.room_id,
              submission.workflow_status as "submitted_to_teacher" | "submitted_to_admin",
            );
          }
        }
      }
    }
  } else {
    joinedRoomsError = "Unable to load joined rooms right now.";
  }

  return (
    <main className="min-h-screen px-4 pb-8 pt-6 sm:px-6 lg:ml-64 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#747685]">Applicant Rooms</p>
            <h1 className="mt-2 text-[2rem] font-bold leading-[1.1] text-[#002576]">Joined Assessment Rooms</h1>
            <p className="mt-2 max-w-2xl text-[15px] leading-[1.6] text-[#444653]">
              Review the rooms you already joined. To connect to a new assessment room, use the Join Assessment Room option from your Applications page.
            </p>
          </div>
        </section>

        {joinedRoomsError ? (
          <div className="mb-6 rounded-lg border border-[#f0b4b4] bg-[#fff5f5] p-4 text-[14px] text-[#8a1f1f]">
            {joinedRoomsError}
          </div>
        ) : null}

        {!joinedRoomsError && visibleRooms.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[#c4c5d5] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
              <i aria-hidden="true" className="fa-solid fa-right-to-bracket text-[18px]" />
            </div>
            <h2 className="mt-4 text-[22px] font-semibold text-[#0b1c30]">No joined rooms yet</h2>
            <p className="mt-2 text-[14px] leading-[1.6] text-[#444653]">
              Go to Applications and use the Join Assessment Room option with a teacher-provided room code.
            </p>
            <Link
              className="mt-5 inline-flex rounded-lg bg-[#002576] px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#0038a8]"
              href="/applicant/applications"
            >
              Go to Applications
            </Link>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleRooms.map((membership) => (
            <article
              key={membership.id}
              className="relative overflow-hidden rounded-lg border border-[#c9d7f5] bg-white px-5 pb-5 pt-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-[#002576]" />

              <div className="mb-5 flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
                  <i aria-hidden="true" className="fa-solid fa-door-open text-[16px]" />
                </div>
                <div className="w-full">
                  <h2 className="mx-auto max-w-[220px] text-[18px] font-bold leading-[1.25] text-[#24364c]">
                    {membership.rooms.name}
                  </h2>
                  <span className="mx-auto mt-3 inline-flex rounded-full bg-[#eef3ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4]">
                    {membership.rooms.qualification}
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
                    {membership.rooms.join_code}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-regular fa-clock text-[14px] text-[#5d5f5f]" />
                    Joined
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#24364c]">
                    {formatJoinedAt(membership.joined_at)}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#d9e3f7] pt-3">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-regular fa-file-lines text-[14px] text-[#5d5f5f]" />
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[13px] font-bold ${getRoomSubmissionStatusBadgeClass(
                      submissionStatusByRoomId.get(membership.rooms.id),
                    )}`}
                  >
                    {getRoomSubmissionStatusLabel(submissionStatusByRoomId.get(membership.rooms.id))}
                  </span>
                </div>
              </div>

              <Link
                className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#002576]"
                href={`/applicant/applications/individual?roomId=${membership.rooms.id}`}
              >
                <span>
                  {submissionStatusByRoomId.get(membership.rooms.id) ? "Continue Application" : "Start Application"}
                </span>
                <i aria-hidden="true" className="fa-solid fa-arrow-right text-[12px]" />
              </Link>
            </article>
          ))}
        </section>
      </div>
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

function getRoomSubmissionStatusLabel(status?: "submitted_to_teacher" | "submitted_to_admin") {
  if (status === "submitted_to_admin") {
    return "Forwarded to Admin";
  }

  if (status === "submitted_to_teacher") {
    return "Submitted";
  }

  return "Pending Submission";
}

function getRoomSubmissionStatusBadgeClass(status?: "submitted_to_teacher" | "submitted_to_admin") {
  if (status === "submitted_to_admin") {
    return "bg-[#e8f2ff] text-[#0038a8]";
  }

  if (status === "submitted_to_teacher") {
    return "bg-[#eefaf1] text-[#1f7a36]";
  }

  return "bg-[#eef3ff] text-[#093cab]";
}
