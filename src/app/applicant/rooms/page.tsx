import { type ApplicationSubmissionStatus } from "@/lib/application-form";
import { getSubmissionAssignmentInfoByIds } from "@/lib/application-submission-lifecycle";
import { loadApplicantJoinedRooms, type ApplicantJoinedRoomMembership } from "@/lib/rooms";
import { requireCurrentAppUserRole } from "@/lib/server-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import ApplicantJoinedRoomsClient from "@/app/applicant/rooms/ApplicantJoinedRoomsClient";

export default async function ApplicantRoomPage() {
  let joinedRoomsError = "";
  let visibleRooms: Array<{
    assessmentCenterName: string | null;
    joinedAt: string;
    joinCode: string;
    membershipId: string;
    qualification: string;
    roomId: string;
    roomName: string;
    submissionStatus: ApplicationSubmissionStatus | null;
  }> = [];
  const submissionStatusByRoomId = new Map<string, ApplicationSubmissionStatus>();
  const centerNameByRoomId = new Map<string, string>();

  const currentUser = await requireCurrentAppUserRole("applicant");
  const { memberships, error } = await loadApplicantJoinedRooms(currentUser.accessToken, currentUser.id);

  if (error) {
    joinedRoomsError = "Unable to load your joined rooms right now. Please try again in a moment.";
  } else {
    const membershipsWithRooms = memberships.filter(
      (membership): membership is ApplicantJoinedRoomMembership & { room: NonNullable<ApplicantJoinedRoomMembership["room"]> } =>
        Boolean(membership.room),
    );

    if (membershipsWithRooms.length > 0) {
      const supabase = createSupabaseAdminClient();
      const { data: submissions } = await supabase
        .from("applicant_application_submissions")
        .select("id, room_id, workflow_status")
        .eq("applicant_id", currentUser.id)
        .in(
          "room_id",
          membershipsWithRooms.map((membership) => membership.room.id),
        );

      const assignmentMap = await getSubmissionAssignmentInfoByIds(
        (submissions ?? []).map((submission) => submission.id).filter(Boolean),
      );

      for (const submission of submissions ?? []) {
        if (!submission.room_id) {
          continue;
        }

        submissionStatusByRoomId.set(submission.room_id, submission.workflow_status as ApplicationSubmissionStatus);

        const assignment = assignmentMap.get(submission.id);

        if (assignment?.assessment_center_name) {
          centerNameByRoomId.set(submission.room_id, assignment.assessment_center_name);
        }
      }
    }

    visibleRooms = membershipsWithRooms.map((membership) => ({
      assessmentCenterName: centerNameByRoomId.get(membership.room.id) ?? null,
      joinedAt: membership.joined_at,
      joinCode: membership.room.join_code,
      membershipId: membership.id,
      qualification: membership.room.qualification,
      roomId: membership.room.id,
      roomName: membership.room.name,
      submissionStatus: submissionStatusByRoomId.get(membership.room.id) ?? null,
    }));
  }

  return <ApplicantJoinedRoomsClient initialError={joinedRoomsError} initialRooms={visibleRooms} />;
}
