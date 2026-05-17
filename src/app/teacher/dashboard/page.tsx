import Link from "next/link";
import { notFound } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getCurrentAppUser } from "@/lib/current-user";
import { getRoomSubmissionStatus, getRoomSubmissionStatusLabel, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

type RoomDashboardRecord = RoomRecord & {
  member_count: number;
  pending_review_count: number;
  submission_status: RoomRecord["submission_status"];
};

const statCardClass = "rounded-[12px] border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function getSubmissionStatusClass(status: RoomRecord["submission_status"]) {
  if (status === "submitted") {
    return "bg-[#edf9f1] text-[#1f7a45]";
  }

  return "bg-[#fff8e8] text-[#8a5200]";
}

export default async function TeacherDashboardPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "teacher") {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  let dashboardNotice = "";

  const { data: roomRows, error: roomsError } = await supabase
    .from("rooms")
    .select("id, name, qualification, join_code, is_active, created_at")
    .eq("teacher_id", currentUser.id)
    .order("created_at", { ascending: false });

  const rooms = (roomRows ?? []) as RoomRecord[];

  let roomDashboardRecords: RoomDashboardRecord[] = rooms.map((room) => ({
    ...room,
    member_count: 0,
    pending_review_count: 0,
    submission_status: "not_submitted",
  }));

  if (roomsError) {
    dashboardNotice = "Some dashboard details could not be loaded right now. You can still open the rooms page below.";
  } else if (rooms.length > 0) {
    const roomIds = rooms.map((room) => room.id);
    const [{ data: memberships, error: membershipsError }, { data: submissions, error: submissionsError }] =
      await Promise.all([
        supabase.from("room_members").select("room_id").in("room_id", roomIds),
        supabase
          .from("applicant_application_submissions")
          .select("room_id, applicant_id, workflow_status")
          .in("room_id", roomIds),
      ]);

    if (membershipsError || submissionsError) {
      dashboardNotice = "Some dashboard details could not be loaded right now. You can still open the rooms page below.";
    } else {
      const memberCounts = new Map<string, number>();
      const submissionsByRoomId = new Map<
        string,
        Array<{ applicant_id: string; workflow_status: ApplicationSubmissionStatus }>
      >();
      const pendingReviewCounts = new Map<string, number>();

      for (const membership of memberships ?? []) {
        const roomId = (membership as { room_id: string }).room_id;
        memberCounts.set(roomId, (memberCounts.get(roomId) ?? 0) + 1);
      }

      for (const submission of submissions ?? []) {
        const typedSubmission = submission as {
          applicant_id: string;
          room_id: string | null;
          workflow_status: ApplicationSubmissionStatus;
        };

        if (!typedSubmission.room_id) {
          continue;
        }

        const roomSubmissions = submissionsByRoomId.get(typedSubmission.room_id) ?? [];
        roomSubmissions.push({
          applicant_id: typedSubmission.applicant_id,
          workflow_status: typedSubmission.workflow_status,
        });
        submissionsByRoomId.set(typedSubmission.room_id, roomSubmissions);

        if (typedSubmission.workflow_status === "submitted_to_teacher") {
          pendingReviewCounts.set(
            typedSubmission.room_id,
            (pendingReviewCounts.get(typedSubmission.room_id) ?? 0) + 1,
          );
        }
      }

      roomDashboardRecords = rooms.map((room) => ({
        ...room,
        member_count: memberCounts.get(room.id) ?? 0,
        pending_review_count: pendingReviewCounts.get(room.id) ?? 0,
        submission_status: getRoomSubmissionStatus(
          memberCounts.get(room.id) ?? 0,
          submissionsByRoomId.get(room.id) ?? [],
        ),
      }));
    }
  }

  const totalJoinedApplicants = roomDashboardRecords.reduce((sum, room) => sum + room.member_count, 0);
  const waitingForReviewCount = roomDashboardRecords.reduce((sum, room) => sum + room.pending_review_count, 0);
  const submittedRoomCount = roomDashboardRecords.filter((room) => room.submission_status === "submitted").length;
  const roomsNeedingAction = roomDashboardRecords
    .filter((room) => room.pending_review_count > 0)
    .sort((left, right) => right.pending_review_count - left.pending_review_count)
    .slice(0, 5);
  const recentRooms = [...roomDashboardRecords]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 5);

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Teacher Dashboard</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Track room activity, pending reviews, and the latest submission flow.
          </p>
        </section>

        {dashboardNotice ? <NotificationBanner className="mb-5" message={dashboardNotice} variant="warning" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Rooms Created</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{roomDashboardRecords.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Assessment rooms currently managed from your teacher account.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Applicants Joined</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{totalJoinedApplicants}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Applicants who already joined one of your room codes.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Waiting for Review</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{waitingForReviewCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Room submissions still waiting for teacher forwarding to TESDA.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Submitted Rooms</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{submittedRoomCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Rooms whose applicants have already moved past the teacher review step.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Needs Teacher Action</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Rooms Waiting for Review</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/teacher/room"
              >
                View All
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {roomsNeedingAction.map((room) => (
                <div key={room.id} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{room.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {room.pending_review_count} waiting for teacher review | {room.member_count} joined
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                      href={`/teacher/room/${room.id}`}
                    >
                      Open Room
                    </Link>
                  </div>
                </div>
              ))}

              {roomsNeedingAction.length === 0 ? (
                <div className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No room submissions are waiting for teacher review right now.
                  </p>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[12px] border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Recent Rooms</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Room Activity</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/teacher/room"
              >
                Manage Rooms
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {recentRooms.map((room) => (
                <div key={room.id} className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{room.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {room.member_count} joined | {room.qualification}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-3 text-[12px] font-bold ${getSubmissionStatusClass(
                          room.submission_status,
                        )}`}
                      >
                        {getRoomSubmissionStatusLabel(room.submission_status ?? "not_submitted")}
                      </span>
                      <Link
                        className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                        href={`/teacher/room/${room.id}`}
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {recentRooms.length === 0 ? (
                <div className="rounded-[10px] border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    No rooms yet. Create your first room to begin inviting applicants.
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
