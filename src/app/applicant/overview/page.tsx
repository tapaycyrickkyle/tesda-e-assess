import Link from "next/link";
import { notFound } from "next/navigation";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { getApplicationSubmissionStatusLabel, type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getSubmissionAssignmentInfoByIds } from "@/lib/application-submission-lifecycle";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadApplicantJoinedRooms, type ApplicantJoinedRoomMembership } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

type DashboardSubmission = {
  assessment_center_name?: string | null;
  id: string;
  qualification_title: string;
  room_id: string | null;
  submission_source: "individual" | "room";
  submitted_at: string;
  teacher_forwarded_at: string | null;
  workflow_status: ApplicationSubmissionStatus;
};

const terminalStatuses: ApplicationSubmissionStatus[] = ["completed", "rejected", "cancelled", "withdrawn"];
const statCardClass = "rounded-xl border border-[#d9e3f7] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getSubmissionStatusText(submission: DashboardSubmission) {
  if (submission.workflow_status === "assigned" || submission.workflow_status === "under_review") {
    return submission.assessment_center_name
      ? `Under review at ${submission.assessment_center_name}`
      : "Under Review at Assessment Center";
  }

  return getApplicationSubmissionStatusLabel(submission.workflow_status);
}

function getSubmissionUpdateText(submission: DashboardSubmission) {
  if (submission.workflow_status === "assigned" || submission.workflow_status === "under_review") {
    return submission.assessment_center_name
      ? `${submission.assessment_center_name} is now reviewing your application.`
      : "The assigned assessment center is now reviewing your application.";
  }

  if (terminalStatuses.includes(submission.workflow_status)) {
    return "This submission is finalized and stays available as a record.";
  }

  if (submission.workflow_status === "submitted_to_teacher") {
    return "Your teacher still needs to review and forward this room submission.";
  }

  return submission.submission_source === "room"
    ? "TESDA has received this room submission and will assign an assessment center next."
    : "TESDA has received this submission. You can still edit it until assignment.";
}

function getRoomStatusText(status?: ApplicationSubmissionStatus, assessmentCenterName?: string) {
  if (status === "assigned" || status === "under_review") {
    return assessmentCenterName ? `Under review at ${assessmentCenterName}` : "Under Review at Assessment Center";
  }

  if (status === "submitted_to_admin") {
    return "Submitted to TESDA";
  }

  if (status === "submitted_to_teacher") {
    return "Submitted to Teacher";
  }

  if (status) {
    return getApplicationSubmissionStatusLabel(status);
  }

  return "No submission yet";
}

function getRoomActionLabel(status?: ApplicationSubmissionStatus) {
  if (!status) {
    return "Start Application";
  }

  if (status === "submitted_to_teacher") {
    return "Continue Application";
  }

  return "Open Submission";
}

export default async function StudentDashboardPage() {
  const currentUser = await getCurrentAppUser();

  if (!currentUser || currentUser.role !== "applicant") {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  let dashboardNotice = "";

  const [{ data: submissionRows, error: submissionsError }, joinedRoomsResult] =
    await Promise.all([
      supabase
        .from("applicant_application_submissions")
        .select("id, qualification_title, room_id, submission_source, submitted_at, teacher_forwarded_at, workflow_status")
        .eq("applicant_id", currentUser.id)
        .order("submitted_at", { ascending: false }),
      loadApplicantJoinedRooms(currentUser.accessToken, currentUser.id),
    ]);
  const joinedRoomsError = joinedRoomsResult.error;

  if (submissionsError || joinedRoomsError) {
    dashboardNotice =
      "Some dashboard details could not be loaded right now. Confirm the room and applicant submissions setup SQL has been run in Supabase, then try again.";
  }

  const assignmentMap = await getSubmissionAssignmentInfoByIds((submissionRows ?? []).map((submission) => submission.id));
  const submissions: DashboardSubmission[] = (submissionRows ?? []).map((submission) => ({
    ...submission,
    assessment_center_name: assignmentMap.get(submission.id)?.assessment_center_name ?? null,
  }));

  const joinedRooms = joinedRoomsResult.memberships.filter(
    (membership): membership is ApplicantJoinedRoomMembership & { room: NonNullable<ApplicantJoinedRoomMembership["room"]> } =>
      Boolean(membership.room),
  );

  const roomStatusById = new Map<string, ApplicationSubmissionStatus>();
  const roomCenterById = new Map<string, string>();

  for (const submission of submissions) {
    if (!submission.room_id) {
      continue;
    }

    roomStatusById.set(submission.room_id, submission.workflow_status);

    if (submission.assessment_center_name) {
      roomCenterById.set(submission.room_id, submission.assessment_center_name);
    }
  }

  const latestSubmission = submissions[0] ?? null;
  const activeSubmissionCount = submissions.filter((submission) => !terminalStatuses.includes(submission.workflow_status)).length;
  const finalizedSubmissionCount = submissions.filter((submission) => terminalStatuses.includes(submission.workflow_status)).length;
  const recentSubmissions = submissions.slice(0, 3);

  return (
    <main className="ui-portal-main pb-8 pt-8">
      <div className="ui-page-content">
        <section className="ui-page-header">
          <h1 className="ui-page-title text-[#002576]">Overview</h1>
          <p className="ui-page-description">
            Track your submissions, room activity, and overall application progress.
          </p>
        </section>

        {dashboardNotice ? <NotificationBanner className="mb-5" message={dashboardNotice} variant="warning" /> : null}

        <section className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Submissions</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{submissions.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">All individual and room-based submissions linked to your account.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Active Forms</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{activeSubmissionCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Submissions still moving through teacher review, TESDA, or center assignment.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Finalized</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{finalizedSubmissionCount}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Completed, rejected, cancelled, or withdrawn submissions kept as records.</p>
          </div>
          <div className={statCardClass}>
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Joined Rooms</p>
            <p className="mt-2 text-[28px] font-bold leading-none text-[#0b1c30]">{joinedRooms.length}</p>
            <p className="mt-2 text-[13px] text-[#747685]">Rooms you already joined using a teacher-provided room code.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <article className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Latest Submission</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">
                  {latestSubmission ? latestSubmission.qualification_title : "No submitted forms yet"}
                </h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/applicant/submissions"
              >
                Open Submissions
              </Link>
            </div>

            {latestSubmission ? (
              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Current Status</p>
                  <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#0b1c30]">
                    {getSubmissionStatusText(latestSubmission)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#747685]">Submitted</p>
                  <p className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#0b1c30]">
                    {formatDate(latestSubmission.submitted_at)}
                  </p>
                </div>
                <div className="rounded-lg border border-[#dbe6fb] bg-[#f7faff] px-4 py-3 md:col-span-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Next Step</p>
                  <p className="mt-2 text-[14px] leading-[1.6] text-[#30435f]">{getSubmissionUpdateText(latestSubmission)}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-[#d9e3f7] bg-[#fbfdff] px-4 py-5">
                <p className="text-[14px] leading-[1.6] text-[#444653]">
                  Once you submit an application, its live status will appear here.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Joined Rooms</p>
                <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Room Access</h2>
              </div>
              <Link
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                href="/applicant/rooms"
              >
                Open Rooms
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {joinedRooms.slice(0, 3).map((membership) => (
                <div key={membership.id} className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-bold text-[#0b1c30]">{membership.room.name}</p>
                      <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                        {getRoomStatusText(
                          roomStatusById.get(membership.room.id),
                          roomCenterById.get(membership.room.id),
                        )}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-[36px] min-w-[140px] shrink-0 items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold whitespace-nowrap text-[#002576] transition hover:bg-[#eff4ff]"
                      href={`/applicant/apply/individual?roomId=${membership.room.id}`}
                    >
                      {getRoomActionLabel(roomStatusById.get(membership.room.id))}
                    </Link>
                  </div>
                </div>
              ))}

              {joinedRooms.length === 0 ? (
                <div className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                  <p className="text-[14px] leading-[1.6] text-[#444653]">
                    You have not joined any rooms yet. Use a teacher-provided room code when you need to submit through a room.
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        <section className="mt-5 rounded-xl border border-[#d9e3f7] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#4563a5]">Recent Submissions</p>
              <h2 className="mt-2 text-[24px] font-bold leading-[1.2] text-[#0b1c30]">Latest Form Activity</h2>
            </div>
            <Link
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-[#f8fbff] px-4 text-[13px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
              href="/applicant/submissions"
            >
              View All
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentSubmissions.map((submission) => (
              <div key={submission.id} className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#0b1c30]">{submission.qualification_title}</p>
                    <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                      {getSubmissionStatusText(submission)} | Submitted {formatDate(submission.submitted_at)}
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-[36px] items-center justify-center rounded-lg border border-[#c4d1eb] bg-white px-3 text-[12px] font-bold text-[#002576] transition hover:bg-[#eff4ff]"
                    href="/applicant/submissions"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}

            {recentSubmissions.length === 0 ? (
              <div className="rounded-lg border border-[#e3ebfb] bg-[#fbfdff] px-4 py-5">
                <p className="text-[14px] leading-[1.6] text-[#444653]">
                  No submissions yet. Start with an individual form or join a room when your teacher gives you a code.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
