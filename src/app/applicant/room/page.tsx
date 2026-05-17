import Link from "next/link";
import NotificationBanner from "@/components/notifications/NotificationBanner";
import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getSubmissionAssignmentInfoByIds } from "@/lib/application-submission-lifecycle";
import { getCurrentAppUser } from "@/lib/current-user";
import { loadApplicantJoinedRooms, type ApplicantJoinedRoomMembership } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

export default async function ApplicantRoomPage() {
  let joinedRoomsError = "";
  let visibleRooms: Array<ApplicantJoinedRoomMembership & { room: NonNullable<ApplicantJoinedRoomMembership["room"]> }> = [];
  const submissionStatusByRoomId = new Map<string, ApplicationSubmissionStatus>();
  const centerNameByRoomId = new Map<string, string>();

  const currentUser = await getCurrentAppUser();

  if (currentUser?.role === "applicant") {
    const { memberships, error } = await loadApplicantJoinedRooms(currentUser.accessToken, currentUser.id);

    if (error) {
      joinedRoomsError = "Unable to load your joined rooms right now. Please try again in a moment.";
    } else {
      visibleRooms = memberships
        .filter(
          (membership): membership is ApplicantJoinedRoomMembership & { room: NonNullable<ApplicantJoinedRoomMembership["room"]> } =>
            Boolean(membership.room),
        );

      if (visibleRooms.length > 0) {
        const supabase = createSupabaseAdminClient();
        const { data: submissions } = await supabase
          .from("applicant_application_submissions")
          .select("id, room_id, workflow_status")
          .eq("applicant_id", currentUser.id)
          .in(
            "room_id",
            visibleRooms.map((membership) => membership.room.id),
          );

        const assignmentMap = await getSubmissionAssignmentInfoByIds(
          (submissions ?? []).map((submission) => submission.id).filter(Boolean),
        );

        for (const submission of submissions ?? []) {
          if (submission.room_id) {
            submissionStatusByRoomId.set(
              submission.room_id,
              submission.workflow_status as ApplicationSubmissionStatus,
            );

            const assignment = assignmentMap.get(submission.id);

            if (assignment?.assessment_center_name) {
              centerNameByRoomId.set(submission.room_id, assignment.assessment_center_name);
            }
          }
        }
      }
    }
  } else {
    joinedRoomsError = "Unable to load your joined rooms right now. Please try again in a moment.";
  }

  return (
    <main className="ui-portal-main pb-8 pt-6">
      <div className="ui-page-content">
        <section className="mb-5">
          <h1 className="text-[34px] font-bold leading-[1.15] text-[#002576]">Joined Assessment Rooms</h1>
          <p className="mt-2 max-w-3xl text-[16px] leading-[1.6] text-[#444653]">
            Review the rooms you have joined and the status of each application.
          </p>
        </section>

        {joinedRoomsError ? (
          <NotificationBanner className="mb-5" message={joinedRoomsError} variant="error" />
        ) : null}

        {!joinedRoomsError && visibleRooms.length === 0 ? (
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
              href="/applicant/applications"
            >
              Go to Applications
            </Link>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {visibleRooms.map((membership) => (
            <article
              key={membership.id}
              className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[12px] border border-[#d9e3f7] bg-white px-4 pb-4 pt-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-[#002576]" />

              <div className="mb-4 flex flex-col items-center text-center">
                <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#eff4ff] text-[#002576]">
                  <i aria-hidden="true" className="fa-solid fa-door-open text-[14px]" />
                </div>
                <div className="w-full">
                  <h2 className="mx-auto max-w-[220px] text-[17px] font-bold leading-[1.25] text-[#24364c]">
                    {membership.room.name}
                  </h2>
                  <div className="mt-2.5 flex min-h-[50px] items-start justify-center">
                    <span className="mx-auto inline-flex max-w-full items-center justify-center rounded-full bg-[#eef3ff] px-3 py-1 text-center text-[11px] font-bold uppercase tracking-[0.06em] text-[#3056c4]">
                      {membership.room.qualification}
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
                    {membership.room.join_code}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-regular fa-clock text-[14px] text-[#5d5f5f]" />
                    Joined
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-[13px] font-medium text-[#24364c]">
                    {formatJoinedAt(membership.joined_at)}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-[#d9e3f7] pt-2.5">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-[#5d5f5f]">
                    <i aria-hidden="true" className="fa-regular fa-file-lines text-[14px] text-[#5d5f5f]" />
                    Status
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[13px] font-bold ${getRoomSubmissionStatusBadgeClass(
                      submissionStatusByRoomId.get(membership.room.id),
                    )}`}
                  >
                    {getRoomSubmissionStatusLabel(
                      submissionStatusByRoomId.get(membership.room.id),
                      centerNameByRoomId.get(membership.room.id),
                    )}
                  </span>
                </div>

                <div className="mt-2.5 border-t border-[#d9e3f7] pt-2.5">
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#747685]">Next Step</p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-[#444653]">
                    {getRoomSubmissionGuidance(
                      submissionStatusByRoomId.get(membership.room.id),
                      centerNameByRoomId.get(membership.room.id),
                    )}
                  </p>
                </div>
              </div>

              <Link
                className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#0038a8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#002576]"
                href={`/applicant/applications/individual?roomId=${membership.room.id}`}
              >
                <span>{getRoomActionLabel(submissionStatusByRoomId.get(membership.room.id))}</span>
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

function getRoomSubmissionStatusLabel(status?: ApplicationSubmissionStatus, assessmentCenterName?: string) {
  if (status === "assigned" || status === "under_review") {
    return assessmentCenterName ? `Under review at ${assessmentCenterName}` : "Under Review at Assessment Center";
  }

  if (status === "completed") {
    return "Completed";
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

  if (status === "submitted_to_teacher") {
    return "Submitted to Teacher";
  }

  return "Pending Submission";
}

function getRoomSubmissionStatusBadgeClass(status?: ApplicationSubmissionStatus) {
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

  if (status === "submitted_to_teacher") {
    return "bg-[#eefaf1] text-[#1f7a36]";
  }

  return "bg-[#eef3ff] text-[#093cab]";
}

function getRoomSubmissionGuidance(status?: ApplicationSubmissionStatus, assessmentCenterName?: string) {
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

  if (status === "submitted_to_teacher") {
    return "Your teacher still needs to review and forward this room submission to TESDA.";
  }

  return "You joined this room successfully. Start your application form when you are ready.";
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
