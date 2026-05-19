import TeacherRoomClient from "@/app/teacher/rooms/TeacherRoomClient";
import { getCurrentAppUser } from "@/lib/current-user";
import { getRoomSubmissionStatus, type RoomRecord } from "@/lib/rooms";
import { createSupabaseAdminClient } from "@/lib/supabase";

export default async function TeacherRoomPage() {
  let initialRooms: RoomRecord[] = [];
  let initialLoadError = "";
  let teacherInstitutionName = "";

  const currentUser = await getCurrentAppUser();

  if (currentUser?.role === "teacher") {
    const supabase = createSupabaseAdminClient();
    const [{ data, error }, { data: profile }] = await Promise.all([
      supabase
        .from("rooms")
        .select("id, name, qualification, join_code, is_active, created_at")
        .eq("teacher_id", currentUser.id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("institution_name").eq("id", currentUser.id).maybeSingle(),
    ]);

    teacherInstitutionName = ((profile as { institution_name?: string | null } | null)?.institution_name ?? "").trim();

    if (error) {
      initialLoadError = "Unable to load your rooms right now. Please try again in a moment.";
    } else {
      const rooms = (data ?? []) as RoomRecord[];

      if (rooms.length > 0) {
        const roomIds = rooms.map((room) => room.id);
        const [{ data: memberships }, { data: submissions }] = await Promise.all([
          supabase.from("room_members").select("room_id").in("room_id", roomIds),
          supabase
            .from("applicant_application_submissions")
            .select("room_id, applicant_id, workflow_status")
            .in("room_id", roomIds),
        ]);

        const counts = new Map<string, number>();
        const submissionsByRoomId = new Map<
          string,
          Array<{ applicant_id: string; workflow_status: "submitted_to_teacher" | "submitted_to_admin" }>
        >();

        for (const membership of memberships ?? []) {
          const roomId = (membership as { room_id: string }).room_id;
          counts.set(roomId, (counts.get(roomId) ?? 0) + 1);
        }

        for (const submission of submissions ?? []) {
          const typedSubmission = submission as {
            applicant_id: string;
            room_id: string | null;
            workflow_status: "submitted_to_teacher" | "submitted_to_admin";
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
        }

        initialRooms = rooms.map((room) => ({
          ...room,
          member_count: counts.get(room.id) ?? 0,
          submission_status: getRoomSubmissionStatus(
            counts.get(room.id) ?? 0,
            submissionsByRoomId.get(room.id) ?? [],
          ),
        }));
      } else {
        initialRooms = rooms;
      }
    }
  }

  return (
    <TeacherRoomClient
      initialLoadError={initialLoadError}
      initialRooms={initialRooms}
      teacherInstitutionName={teacherInstitutionName}
    />
  );
}
